"""Generate the small, loopable instrumental soundtrack used by the game.

The renderer stays dependency-free: the output is plain 16-bit PCM WAV and is
intentionally made from soft additive voices rather than square-wave chiptune.
"""

from __future__ import annotations

import math
import os
import struct
import wave


RATE = 16_000
DURATION = 48.0
BEAT = 0.75
TAU = math.tau
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "audio", "music")

TRACKS = {
    "field": (48, [0, 7, 9, 5], [0, 2, 4, 7, 9, 12, 9, 7]),
    "meadow": (50, [2, 9, 11, 6], [2, 4, 6, 9, 11, 14, 11, 9]),
    "forest": (45, [9, 4, 0, 7], [9, 11, 12, 16, 14, 12, 11, 9]),
    "night": (52, [4, 11, 7, 2], [4, 7, 11, 14, 11, 9, 7, 4]),
    "city": (55, [7, 2, 9, 0], [7, 9, 11, 14, 16, 14, 11, 9]),
}


def midi(note: float) -> float:
    return 440.0 * (2.0 ** ((note - 69.0) / 12.0))


def smoothstep(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return value * value * (3.0 - 2.0 * value)


def pluck(t: float, length: float, frequency: float) -> float:
    attack = smoothstep(t / 0.035)
    decay = math.exp(-4.5 * max(0.0, t) / max(0.08, length))
    body = math.sin(TAU * frequency * t) + 0.32 * math.sin(TAU * frequency * 2.0 * t)
    shimmer = 0.11 * math.sin(TAU * frequency * 3.01 * t)
    return attack * decay * (body + shimmer)


def pad(t: float, frequency: float, amount: float) -> float:
    wobble = 0.012 * math.sin(TAU * 0.13 * t)
    return amount * (
        0.66 * math.sin(TAU * frequency * (1.0 + wobble) * t)
        + 0.22 * math.sin(TAU * frequency * 2.0 * t)
        + 0.12 * math.sin(TAU * frequency * 0.5 * t)
    )


def render(root: int, chords: list[int], melody: list[int]) -> list[int]:
    total = int(DURATION * RATE)
    samples = [0.0] * total
    chord_len = 4.0 * BEAT

    for index in range(total):
        t = index / RATE
        section = int(t / chord_len) % len(chords)
        local = t % chord_len
        root_note = root + chords[section]

        # Warm sustained harmony: root, fifth and a quiet upper third.
        value = pad(t, midi(root_note), 0.095)
        value += pad(t, midi(root_note + 7), 0.065)
        value += pad(t, midi(root_note + 12), 0.028)

        # A soft bass pulse gives the melody a musical floor without a click.
        bass_phase = (t % BEAT) / BEAT
        bass_env = 0.7 + 0.3 * math.cos(TAU * bass_phase)
        value += 0.095 * bass_env * math.sin(TAU * midi(root_note - 24) * t)

        # Eight-note motif, repeated with a gentle octave answer every second bar.
        motif_index = int((t % (2.0 * BEAT)) / BEAT * 2.0) % len(melody)
        note_start = (int(t / BEAT) * BEAT)
        elapsed = t - note_start
        note = root + 12 + melody[motif_index]
        if (int(t / (2.0 * BEAT)) % 2) == 1:
            note += 12
        value += 0.22 * pluck(elapsed, BEAT * 0.92, midi(note))

        # A very quiet fifth echo makes the loop feel spacious rather than 8-bit.
        echo_time = elapsed - 0.17
        if echo_time > 0:
            value += 0.045 * pluck(echo_time, BEAT * 0.8, midi(note))
        samples[index] = value

    peak = max(abs(value) for value in samples) or 1.0
    gain = 0.72 / peak
    result = [int(max(-1.0, min(1.0, value * gain)) * 32767) for value in samples]

    # Hide the loop seam with a short equal-power crossfade.
    fade = int(0.18 * RATE)
    for i in range(fade):
        tail = total - fade + i
        blend = i / max(1, fade - 1)
        result[tail] = int(result[tail] * (1.0 - blend) + result[i] * blend)
    return result


def write_track(name: str, root: int, chords: list[int], melody: list[int]) -> None:
    path = os.path.join(OUT_DIR, f"{name}.wav")
    os.makedirs(OUT_DIR, exist_ok=True)
    data = render(root, chords, melody)
    with wave.open(path, "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(b"".join(struct.pack("<h", value) for value in data))
    print(f"{name}: {len(data) / RATE:.1f}s -> {path}")


if __name__ == "__main__":
    for track, (root, chords, melody) in TRACKS.items():
        write_track(track, root, chords, melody)
