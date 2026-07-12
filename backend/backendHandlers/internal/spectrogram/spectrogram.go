package spectrogram

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image"
	"image/color"
	"image/jpeg"
	"math"

	"jaga/backend/go/internal/audioPreprocess"
)

const (
	numMels     = 64
	melFloorHz  = 125.0
	melCeilHz   = 7500.0
	windowSec   = 0.025
	hopSec      = 0.010
	outWidth    = 480
	cellHeight  = 2
	jpegQuality = 82
)

func Render(audio audioPreprocess.Audio, highlightStartSec, highlightEndSec float64) (string, error) {
	if audio.SampleRate <= 0 || len(audio.Samples) == 0 {
		return "", fmt.Errorf("spectrogram: empty audio")
	}

	windowLen := int(windowSec * float64(audio.SampleRate))
	hopLen := int(hopSec * float64(audio.SampleRate))
	if windowLen < 16 {
		windowLen = 16
	}
	if hopLen < 1 {
		hopLen = 1
	}
	if len(audio.Samples) < windowLen {
		return "", fmt.Errorf("spectrogram: recording too short")
	}

	nfft := nextPow2(windowLen)
	hann := hannWindow(windowLen)
	filters := melFilterbank(numMels, nfft, float64(audio.SampleRate), melFloorHz, math.Min(melCeilHz, float64(audio.SampleRate)/2))

	frames := logMelFrames(audio.Samples, windowLen, hopLen, nfft, hann, filters)
	if len(frames) == 0 {
		return "", fmt.Errorf("spectrogram: no frames")
	}

	pooled := poolToWidth(frames, outWidth)
	normalize(pooled)

	totalSec := float64(len(audio.Samples)) / float64(audio.SampleRate)
	img := draw(pooled, highlightStartSec, highlightEndSec, totalSec)

	return encodeDataURI(img)
}

func logMelFrames(samples []float64, windowLen, hopLen, nfft int, hann []float64, filters [][]float64) [][]float64 {
	numBins := nfft/2 + 1
	var frames [][]float64

	re := make([]float64, nfft)
	im := make([]float64, nfft)
	power := make([]float64, numBins)

	for start := 0; start+windowLen <= len(samples); start += hopLen {
		for i := 0; i < nfft; i++ {
			if i < windowLen {
				re[i] = samples[start+i] * hann[i]
			} else {
				re[i] = 0
			}
			im[i] = 0
		}
		fft(re, im)
		for k := 0; k < numBins; k++ {
			power[k] = re[k]*re[k] + im[k]*im[k]
		}

		mel := make([]float64, numMels)
		for m := 0; m < numMels; m++ {
			var sum float64
			for k := 0; k < numBins; k++ {
				sum += filters[m][k] * power[k]
			}
			mel[m] = math.Log(sum + 1e-10)
		}
		frames = append(frames, mel)
	}
	return frames
}

// poolToWidth max-pools the time axis down to `width` columns so long recordings
// still render at a fixed size.
func poolToWidth(frames [][]float64, width int) [][]float64 {
	if len(frames) <= width {
		return frames
	}
	out := make([][]float64, width)
	for x := 0; x < width; x++ {
		lo := x * len(frames) / width
		hi := (x + 1) * len(frames) / width
		if hi <= lo {
			hi = lo + 1
		}
		column := make([]float64, numMels)
		for m := 0; m < numMels; m++ {
			best := math.Inf(-1)
			for f := lo; f < hi && f < len(frames); f++ {
				if frames[f][m] > best {
					best = frames[f][m]
				}
			}
			column[m] = best
		}
		out[x] = column
	}
	return out
}

func normalize(frames [][]float64) {
	minVal, maxVal := math.Inf(1), math.Inf(-1)
	for _, column := range frames {
		for _, v := range column {
			if v < minVal {
				minVal = v
			}
			if v > maxVal {
				maxVal = v
			}
		}
	}
	span := maxVal - minVal
	if span <= 0 {
		span = 1
	}
	for _, column := range frames {
		for m := range column {
			column[m] = (column[m] - minVal) / span
		}
	}
}

func draw(frames [][]float64, highlightStartSec, highlightEndSec, totalSec float64) *image.RGBA {
	width := len(frames)
	height := numMels * cellHeight
	img := image.NewRGBA(image.Rect(0, 0, width, height))

	for x := 0; x < width; x++ {
		for m := 0; m < numMels; m++ {
			r, g, b := magma(frames[x][m])
			// Flip vertically so low mel bands sit at the bottom.
			yTop := (numMels - 1 - m) * cellHeight
			for dy := 0; dy < cellHeight; dy++ {
				img.Set(x, yTop+dy, color.RGBA{r, g, b, 255})
			}
		}
	}

	if highlightEndSec > highlightStartSec && totalSec > 0 {
		x0 := int(math.Round(highlightStartSec / totalSec * float64(width)))
		x1 := int(math.Round(highlightEndSec / totalSec * float64(width)))
		drawHighlight(img, clamp(x0, 0, width-1), clamp(x1, 0, width-1), height)
	}
	return img
}

// drawHighlight outlines the detected cough window with a bright border.
func drawHighlight(img *image.RGBA, x0, x1, height int) {
	marker := color.RGBA{80, 240, 255, 255} // cyan
	for y := 0; y < height; y++ {
		img.Set(x0, y, marker)
		img.Set(x1, y, marker)
	}
	for x := x0; x <= x1; x++ {
		img.Set(x, 0, marker)
		img.Set(x, height-1, marker)
	}
}

func encodeDataURI(img *image.RGBA) (string, error) {
	var buffer bytes.Buffer
	if err := jpeg.Encode(&buffer, img, &jpeg.Options{Quality: jpegQuality}); err != nil {
		return "", fmt.Errorf("spectrogram: encoding JPEG: %w", err)
	}
	encoded := base64.StdEncoding.EncodeToString(buffer.Bytes())
	return "data:image/jpeg;base64," + encoded, nil
}

// ---- DSP + color helpers ----

func hannWindow(n int) []float64 {
	window := make([]float64, n)
	for i := range window {
		window[i] = 0.5 - 0.5*math.Cos(2*math.Pi*float64(i)/float64(n-1))
	}
	return window
}

func melFilterbank(mels, nfft int, rate, fmin, fmax float64) [][]float64 {
	numBins := nfft/2 + 1
	melMin, melMax := hzToMel(fmin), hzToMel(fmax)

	points := make([]float64, mels+2)
	for i := range points {
		mel := melMin + (melMax-melMin)*float64(i)/float64(mels+1)
		points[i] = melToHz(mel) * float64(nfft) / rate // in fft bins
	}

	filters := make([][]float64, mels)
	for m := 0; m < mels; m++ {
		filters[m] = make([]float64, numBins)
		left, center, right := points[m], points[m+1], points[m+2]
		for k := 0; k < numBins; k++ {
			f := float64(k)
			var w float64
			switch {
			case f >= left && f <= center:
				w = (f - left) / (center - left + 1e-9)
			case f > center && f <= right:
				w = (right - f) / (right - center + 1e-9)
			}
			if w > 0 {
				filters[m][k] = w
			}
		}
	}
	return filters
}

func hzToMel(hz float64) float64  { return 2595 * math.Log10(1+hz/700) }
func melToHz(mel float64) float64 { return 700 * (math.Pow(10, mel/2595) - 1) }

// fft computes an in-place iterative radix-2 FFT (len must be a power of 2).
func fft(re, im []float64) {
	n := len(re)
	for i, j := 1, 0; i < n; i++ {
		bit := n >> 1
		for ; j&bit != 0; bit >>= 1 {
			j ^= bit
		}
		j ^= bit
		if i < j {
			re[i], re[j] = re[j], re[i]
			im[i], im[j] = im[j], im[i]
		}
	}
	for length := 2; length <= n; length <<= 1 {
		angle := -2 * math.Pi / float64(length)
		wlenRe, wlenIm := math.Cos(angle), math.Sin(angle)
		for i := 0; i < n; i += length {
			wRe, wIm := 1.0, 0.0
			for k := 0; k < length/2; k++ {
				aRe, aIm := re[i+k], im[i+k]
				bRe := re[i+k+length/2]*wRe - im[i+k+length/2]*wIm
				bIm := re[i+k+length/2]*wIm + im[i+k+length/2]*wRe
				re[i+k], im[i+k] = aRe+bRe, aIm+bIm
				re[i+k+length/2], im[i+k+length/2] = aRe-bRe, aIm-bIm
				wRe, wIm = wRe*wlenRe-wIm*wlenIm, wRe*wlenIm+wIm*wlenRe
			}
		}
	}
}

func nextPow2(n int) int {
	p := 1
	for p < n {
		p <<= 1
	}
	return p
}

// magma maps [0,1] to an approximate magma colormap.
func magma(v float64) (uint8, uint8, uint8) {
	stops := [][3]float64{
		{0, 0, 4}, {40, 11, 84}, {101, 21, 110}, {159, 42, 99},
		{212, 72, 66}, {245, 125, 21}, {250, 193, 39}, {252, 255, 164},
	}
	if v <= 0 {
		return 0, 0, 4
	}
	if v >= 1 {
		return 252, 255, 164
	}
	scaled := v * float64(len(stops)-1)
	idx := int(scaled)
	frac := scaled - float64(idx)
	a, b := stops[idx], stops[idx+1]
	return uint8(a[0] + (b[0]-a[0])*frac),
		uint8(a[1] + (b[1]-a[1])*frac),
		uint8(a[2] + (b[2]-a[2])*frac)
}

func clamp(v, lo, hi int) int {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}
