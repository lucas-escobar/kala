import noise 
import pydub

def main():
    sample_rate = 44100
    duration = 10
    brown_noise = noise.generate_brown_noise(duration, sample_rate)
    save_to_mp3(brown_noise, sample_rate, "./dist/brown.mp3")


def save_to_mp3(audio_data, sample_rate, file_path):
    audio_segment = pydub.AudioSegment(
        audio_data.tobytes(),
        frame_rate=sample_rate,
        sample_width=audio_data.dtype.itemsize,
        channels=len(audio_data.shape)
    )
    audio_segment.export(file_path, format="mp3")



if __name__ == "__main__":
    main()