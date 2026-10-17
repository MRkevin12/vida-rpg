"""generar-voces-kokoro.py — Crea los audios de una voz Kokoro para la carrera (carpeta locutor/<voz>/), v130.

Kokoro (https://github.com/hexgrad/kokoro, modelo Apache-2.0; paquete kokoro-onnx, MIT) suena más fluido que Piper.
Se le pide pronunciación latinoamericana (es-419: seseo, sin la «z» de España).
Hace falta (fuera del repo):
    pip install --target <carpeta> kokoro-onnx imageio-ffmpeg
    kokoro-v1.0.onnx y voices-v1.0.bin (https://github.com/thewh1teagle/kokoro-onnx/releases, «model-files-v1.0»)
Uso:
    PYTHONPATH=<carpeta> python herramientas/generar-voces-kokoro.py dora ef_dora <kokoro.onnx> <voices.bin> [clave ...]
    (voces en español de Kokoro: ef_dora (mujer), em_alex y em_santa (hombres))
"""
import json
import subprocess
import sys
import wave
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from kokoro_onnx import Kokoro

RAIZ = Path(__file__).resolve().parent.parent
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
IDIOMA = "es-419"     # español de Latinoamérica
VELOCIDAD = 1.0

# Igual que generar-voces.py: sin silencio al principio ni al final, volumen parejo, MP3 mono de 32 kb/s.
FILTRO = (
    "silenceremove=start_periods=1:start_silence=0.03:start_threshold=-36dB,areverse,"
    "silenceremove=start_periods=1:start_silence=0.06:start_threshold=-36dB,areverse,"
    "loudnorm=I=-16:LRA=7:TP=-1.5"
)


def main():
    voz, voz_kokoro, modelo, voces, *solo = sys.argv[1:]
    textos = json.loads(subprocess.run(["node", str(RAIZ / "herramientas" / "lista-de-clips.mjs")], capture_output=True, check=True, encoding="utf-8").stdout)
    if solo:
        textos = {k: v for k, v in textos.items() if k in solo}
    salida = RAIZ / "locutor" / voz
    salida.mkdir(parents=True, exist_ok=True)
    tmp = RAIZ / "locutor" / f"_tmp-{voz}.wav"
    kokoro = Kokoro(modelo, voces)
    total = len(textos)
    for i, (clave, texto) in enumerate(textos.items(), 1):
        muestras, frecuencia = kokoro.create(texto, voice=voz_kokoro, speed=VELOCIDAD, lang=IDIOMA)
        with wave.open(str(tmp), "wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(frecuencia)
            wav.writeframes((np.clip(muestras, -1, 1) * 32767).astype(np.int16).tobytes())
        subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", str(tmp), "-af", FILTRO, "-ac", "1", "-ar", "24000", "-b:a", "32k",
                        str(salida / f"{clave}.mp3")], check=True)
        if i % 25 == 0 or i == total:
            print(f"{voz}: {i}/{total}", flush=True)
    tmp.unlink(missing_ok=True)
    peso = sum(f.stat().st_size for f in salida.glob("*.mp3"))
    print(f"Listo: {len(list(salida.glob('*.mp3')))} audios, {peso / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
