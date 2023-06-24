import numpy as np
import scipy


def generate_white_noise(duration, sample_rate):
    num_samples = int(duration*sample_rate)
    white_noise = np.random.uniform(-1, 1, num_samples)
    return white_noise


def generate_brown_noise(duration, sample_rate):
    num_samples = int(duration * sample_rate)
    time = np.arange(num_samples) / sample_rate
    steps = np.random.randn(num_samples)

    # Integrate the steps to get the brown noise signal
    brown_noise = np.cumsum(steps)

    cutoff_freq = 1000
    brown_noise = apply_low_pass_filter(brown_noise, cutoff_freq, sample_rate)

    # Normalize the signal
    brown_noise /= np.max(np.abs(brown_noise))

    return brown_noise



def apply_low_pass_filter(waveform, cutoff_freq, sample_rate):
    nyquist_freq = 0.5 * sample_rate
    b, a = scipy.signal.butter(4, cutoff_freq / nyquist_freq, 'low')
    filtered_wave = scipy.signal.lfilter(b, a, waveform)
    return filtered_wave 

