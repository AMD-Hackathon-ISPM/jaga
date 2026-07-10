package audioPreprocess

import (
	"encoding/binary"
	"errors"
	"math"
)

type Audio struct {
	Samples    []float64
	SampleRate int
}

const (
	formatPCM        = 1
	formatIEEEFloat  = 3
	formatExtensible = 0xFFFE
)

var (
	errNotRIFF      = errors.New("audio: not a RIFF/WAVE file")
	errNoFmtChunk   = errors.New("audio: missing fmt chunk")
	errNoDataChunk  = errors.New("audio: missing data chunk")
	errBadFmtChunk  = errors.New("audio: malformed fmt chunk")
	errUnsupported  = errors.New("audio: unsupported WAV encoding")
	errNoSampleRate = errors.New("audio: sample rate is zero")
)

func DecodeWAV(data []byte) (Audio, error) {
	if len(data) < 12 || string(data[0:4]) != "RIFF" || string(data[8:12]) != "WAVE" {
		return Audio{}, errNotRIFF
	}

	var (
		audioFormat   uint16
		numChannels   uint16
		sampleRate    uint32
		bitsPerSample uint16
		haveFmt       bool
		pcm           []byte
		haveData      bool
	)

	offset := 12
	for offset+8 <= len(data) {
		chunkID := string(data[offset : offset+4])
		chunkSize := int(binary.LittleEndian.Uint32(data[offset+4 : offset+8]))
		body := offset + 8
		if body+chunkSize > len(data) {
			chunkSize = len(data) - body
		}

		switch chunkID {
		case "fmt ":
			if chunkSize < 16 {
				return Audio{}, errBadFmtChunk
			}
			audioFormat = binary.LittleEndian.Uint16(data[body : body+2])
			numChannels = binary.LittleEndian.Uint16(data[body+2 : body+4])
			sampleRate = binary.LittleEndian.Uint32(data[body+4 : body+8])
			bitsPerSample = binary.LittleEndian.Uint16(data[body+14 : body+16])
			if audioFormat == formatExtensible && chunkSize >= 26 {
				audioFormat = binary.LittleEndian.Uint16(data[body+24 : body+26])
			}
			haveFmt = true
		case "data":
			pcm = data[body : body+chunkSize]
			haveData = true
		}

		offset = body + chunkSize
		if chunkSize%2 == 1 {
			offset++
		}
	}

	if !haveFmt {
		return Audio{}, errNoFmtChunk
	}
	if !haveData {
		return Audio{}, errNoDataChunk
	}
	if sampleRate == 0 {
		return Audio{}, errNoSampleRate
	}
	if numChannels == 0 {
		numChannels = 1
	}

	interleaved, err := decodeSamples(pcm, audioFormat, bitsPerSample)
	if err != nil {
		return Audio{}, err
	}

	mono := downmix(interleaved, int(numChannels))
	return Audio{Samples: mono, SampleRate: int(sampleRate)}, nil
}

func decodeSamples(pcm []byte, audioFormat, bitsPerSample uint16) ([]float64, error) {
	switch audioFormat {
	case formatPCM:
		switch bitsPerSample {
		case 8:
			return decodePCM8(pcm), nil
		case 16:
			return decodePCM16(pcm), nil
		case 24:
			return decodePCM24(pcm), nil
		case 32:
			return decodePCM32(pcm), nil
		}
	case formatIEEEFloat:
		switch bitsPerSample {
		case 32:
			return decodeFloat32(pcm), nil
		case 64:
			return decodeFloat64(pcm), nil
		}
	}
	return nil, errUnsupported
}

func decodePCM8(pcm []byte) []float64 {
	out := make([]float64, len(pcm))
	for i, b := range pcm {
		out[i] = (float64(b) - 128) / 128
	}
	return out
}

func decodePCM16(pcm []byte) []float64 {
	n := len(pcm) / 2
	out := make([]float64, n)
	for i := 0; i < n; i++ {
		sample := int16(binary.LittleEndian.Uint16(pcm[i*2 : i*2+2]))
		out[i] = float64(sample) / 32768
	}
	return out
}

func decodePCM24(pcm []byte) []float64 {
	n := len(pcm) / 3
	out := make([]float64, n)
	for i := 0; i < n; i++ {
		b := pcm[i*3 : i*3+3]
		value := int32(b[0]) | int32(b[1])<<8 | int32(b[2])<<16
		if value&0x800000 != 0 {
			value |= ^0xFFFFFF
		}
		out[i] = float64(value) / 8388608
	}
	return out
}

func decodePCM32(pcm []byte) []float64 {
	n := len(pcm) / 4
	out := make([]float64, n)
	for i := 0; i < n; i++ {
		sample := int32(binary.LittleEndian.Uint32(pcm[i*4 : i*4+4]))
		out[i] = float64(sample) / 2147483648
	}
	return out
}

func decodeFloat32(pcm []byte) []float64 {
	n := len(pcm) / 4
	out := make([]float64, n)
	for i := 0; i < n; i++ {
		out[i] = float64(math.Float32frombits(binary.LittleEndian.Uint32(pcm[i*4 : i*4+4])))
	}
	return out
}

func decodeFloat64(pcm []byte) []float64 {
	n := len(pcm) / 8
	out := make([]float64, n)
	for i := 0; i < n; i++ {
		out[i] = math.Float64frombits(binary.LittleEndian.Uint64(pcm[i*8 : i*8+8]))
	}
	return out
}

func downmix(interleaved []float64, channels int) []float64 {
	if channels <= 1 {
		return interleaved
	}
	frames := len(interleaved) / channels
	mono := make([]float64, frames)
	for frame := 0; frame < frames; frame++ {
		var sum float64
		for c := 0; c < channels; c++ {
			sum += interleaved[frame*channels+c]
		}
		mono[frame] = sum / float64(channels)
	}
	return mono
}

func EncodeWAV(audio Audio) []byte {
	const bitsPerSample = 16
	const channels = 1
	byteRate := audio.SampleRate * channels * bitsPerSample / 8
	blockAlign := channels * bitsPerSample / 8
	dataSize := len(audio.Samples) * blockAlign

	buf := make([]byte, 0, 44+dataSize)
	buf = append(buf, "RIFF"...)
	buf = appendUint32(buf, uint32(36+dataSize))
	buf = append(buf, "WAVE"...)

	buf = append(buf, "fmt "...)
	buf = appendUint32(buf, 16)
	buf = appendUint16(buf, formatPCM)
	buf = appendUint16(buf, channels)
	buf = appendUint32(buf, uint32(audio.SampleRate))
	buf = appendUint32(buf, uint32(byteRate))
	buf = appendUint16(buf, uint16(blockAlign))
	buf = appendUint16(buf, bitsPerSample)

	buf = append(buf, "data"...)
	buf = appendUint32(buf, uint32(dataSize))
	for _, sample := range audio.Samples {
		buf = appendUint16(buf, uint16(int16(clampToInt16(sample))))
	}
	return buf
}

func clampToInt16(sample float64) float64 {
	scaled := math.Round(sample * 32767)
	if scaled > 32767 {
		return 32767
	}
	if scaled < -32768 {
		return -32768
	}
	return scaled
}

func appendUint16(buf []byte, value uint16) []byte {
	return append(buf, byte(value), byte(value>>8))
}

func appendUint32(buf []byte, value uint32) []byte {
	return append(buf, byte(value), byte(value>>8), byte(value>>16), byte(value>>24))
}
