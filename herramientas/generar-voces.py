"""generar-voces.py — Crea los audios de la voz de la carrera (carpeta locutor/<voz>/).

Es una herramienta para quien programa la app: NO se usa en el teléfono. Los audios ya generados viven en locutor/ y se suben al repo.
Hace falta (fuera del repo):
    pip install --target <carpeta> piper-tts imageio-ffmpeg
    un modelo de Piper (.onnx + .onnx.json), p. ej. es_MX-ald-medium (Unlicense) o es_MX-claude-high (Apache-2.0)
Uso:
    PYTHONPATH=<carpeta> python herramientas/generar-voces.py ald  <ruta/al/modelo.onnx>
    PYTHONPATH=<carpeta> python herramientas/generar-voces.py claude <ruta/al/modelo.onnx> [clave ...]   # solo esas claves
La lista de audios sale de js/frases.js (herramientas/lista-de-clips.mjs). Si cambias un texto, vuelve a generar ese audio.
"""
import json
import subprocess
import sys
import wave
from pathlib import Path

import imageio_ffmpeg
from piper import PiperVoice

RAIZ = Path(__file__).resolve().parent.parent
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

# Quita el silencio del principio y del final (se hace en los dos sentidos con areverse), sube el volumen parejo
# y guarda en MP3 mono de 32 kb/s: pequeño, y todos los iPhone lo reproducen.
FILTRO = (
    "silenceremove=start_periods=1:start_silence=0.03:start_threshold=-36dB,areverse,"
    "silenceremove=start_periods=1:start_silence=0.06:start_threshold=-36dB,areverse,"
    "loudnorm=I=-16:LRA=7:TP=-1.5"
)


def main():
    voz, modelo, *solo = sys.argv[1:]
    textos = json.loads(subprocess.run(["node", str(RAIZ / "herramientas" / "lista-de-clips.mjs")], capture_output=True, check=True, encoding="utf-8").stdout)
    if solo:
        textos = {k: v for k, v in textos.items() if k in solo}
    salida = RAIZ / "locutor" / voz
    salida.mkdir(parents=True, exist_ok=True)
    tmp = RAIZ / "locutor" / f"_tmp-{voz}.wav"
    piper = PiperVoice.load(modelo)
    total = len(textos)
    for i, (clave, texto) in enumerate(textos.items(), 1):
        destino = salida / f"{clave}.mp3"
        with wave.open(str(tmp), "wb") as wav:
            piper.synthesize_wav(texto, wav)
        subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", str(tmp), "-af", FILTRO, "-ac", "1", "-ar", "22050", "-b:a", "32k", str(destino)], check=True)
        if i % 25 == 0 or i == total:
            print(f"{voz}: {i}/{total}", flush=True)
    tmp.unlink(missing_ok=True)
    peso = sum(f.stat().st_size for f in salida.glob("*.mp3"))
    print(f"Listo: {len(list(salida.glob('*.mp3')))} audios, {peso / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
