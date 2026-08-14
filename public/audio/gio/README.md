# Gio's voice clips

Drop 11 short MP3s here, generated in ElevenLabs with the "Massimo" voice,
one per catchphrase (exact text below, spoken with the trailing "!"):

| Phrase spoken       | Filename               |
|----------------------|-------------------------|
| Buongiorno!          | buongiorno.mp3          |
| Perfetto!            | perfetto.mp3             |
| Delizioso!           | delizioso.mp3            |
| Bravissimo!          | bravissimo.mp3           |
| Magnifico!           | magnifico.mp3            |
| Fantastico!          | fantastico.mp3           |
| Incredibile!         | incredibile.mp3          |
| Mamma mia!           | mamma-mia.mp3            |
| Ecco qua!            | ecco-qua.mp3             |
| Che bello!           | che-bello.mp3            |
| Missione compiuta!   | missione-compiuta.mp3    |

Once a file lands here, the app picks it up automatically (see
src/lib/gioVoice.ts) — no code change needed. Missing files silently
fall back to the browser's free speech synthesis, so it's safe to add
these incrementally.
