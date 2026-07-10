package audioPreprocess

import "math"

type Options struct {
	RemoveDCOffset   bool
	HighPassCutoffHz float64
	TrimSilence      bool
	Normalize        bool
	TargetPeak       float64
}

func DefaultOptions() Options {
	return Options{
		RemoveDCOffset:   true,
		HighPassCutoffHz: 80,
		TrimSilence:      true,
		Normalize:        true,
		TargetPeak:       0.99,
	}
}

func Process(audio Audio, options Options) Audio {
	if options.RemoveDCOffset {
		audio.Samples = removeDCOffset(audio.Samples)
	}
	if options.HighPassCutoffHz > 0 {
		audio.Samples = highPass(audio.Samples, audio.SampleRate, options.HighPassCutoffHz)
	}
	if options.TrimSilence {
		audio.Samples = trimSilence(audio.Samples, audio.SampleRate)
	}
	if options.Normalize {
		audio.Samples = peakNormalize(audio.Samples, options.TargetPeak)
	}
	return audio
}

func removeDCOffset(samples []float64) []float64 {
	if len(samples) == 0 {
		return samples
	}
	var sum float64
	for _, sample := range samples {
		sum += sample
	}
	mean := sum / float64(len(samples))
	for i := range samples {
		samples[i] -= mean
	}
	return samples
}

func highPass(samples []float64, sampleRate int, cutoffHz float64) []float64 {
	if len(samples) == 0 || sampleRate <= 0 {
		return samples
	}
	nyquist := float64(sampleRate) / 2
	if cutoffHz >= nyquist {
		return samples
	}

	const q = math.Sqrt2 / 2
	w0 := 2 * math.Pi * cutoffHz / float64(sampleRate)
	cosW0 := math.Cos(w0)
	alpha := math.Sin(w0) / (2 * q)

	b0 := (1 + cosW0) / 2
	b1 := -(1 + cosW0)
	b2 := (1 + cosW0) / 2
	a0 := 1 + alpha
	a1 := -2 * cosW0
	a2 := 1 - alpha

	nb0, nb1, nb2 := b0/a0, b1/a0, b2/a0
	na1, na2 := a1/a0, a2/a0

	out := make([]float64, len(samples))
	var x1, x2, y1, y2 float64
	for i, x0 := range samples {
		y0 := nb0*x0 + nb1*x1 + nb2*x2 - na1*y1 - na2*y2
		out[i] = y0
		x2, x1 = x1, x0
		y2, y1 = y1, y0
	}
	return out
}

func peakNormalize(samples []float64, targetPeak float64) []float64 {
	if len(samples) == 0 {
		return samples
	}
	if targetPeak <= 0 {
		targetPeak = 0.99
	}
	var peak float64
	for _, sample := range samples {
		if abs := math.Abs(sample); abs > peak {
			peak = abs
		}
	}
	if peak == 0 {
		return samples
	}
	gain := targetPeak / peak
	for i := range samples {
		samples[i] *= gain
	}
	return samples
}

func trimSilence(samples []float64, sampleRate int) []float64 {
	if len(samples) == 0 || sampleRate <= 0 {
		return samples
	}

	windowLen := sampleRate / 50
	if windowLen < 1 {
		windowLen = 1
	}

	windowCount := (len(samples) + windowLen - 1) / windowLen
	rms := make([]float64, windowCount)
	var maxRMS float64
	for w := 0; w < windowCount; w++ {
		start := w * windowLen
		end := start + windowLen
		if end > len(samples) {
			end = len(samples)
		}
		var sumSquares float64
		for i := start; i < end; i++ {
			sumSquares += samples[i] * samples[i]
		}
		value := math.Sqrt(sumSquares / float64(end-start))
		rms[w] = value
		if value > maxRMS {
			maxRMS = value
		}
	}

	const absoluteFloor = 1e-4
	threshold := maxRMS * 0.1
	if threshold < absoluteFloor {
		threshold = absoluteFloor
	}

	firstActive, lastActive := -1, -1
	for w := 0; w < windowCount; w++ {
		if rms[w] >= threshold {
			if firstActive == -1 {
				firstActive = w
			}
			lastActive = w
		}
	}
	if firstActive == -1 {
		return samples
	}

	const marginWindows = 2
	firstActive -= marginWindows
	if firstActive < 0 {
		firstActive = 0
	}
	lastActive += marginWindows
	if lastActive >= windowCount {
		lastActive = windowCount - 1
	}

	start := firstActive * windowLen
	end := (lastActive + 1) * windowLen
	if end > len(samples) {
		end = len(samples)
	}
	return samples[start:end]
}
