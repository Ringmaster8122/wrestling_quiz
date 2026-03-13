# Admin-Notiz: Veröffentlichung des Quiz

Um dieses Quiz online zu stellen, damit Mitglieder deiner Facebook-Gruppe es spielen können, folge diesen Schritten:

## 1. Hosting (Wo die Dateien liegen)
Da dies eine reine HTML/CSS/JS Anwendung ist, kannst du sie kostenlos auf verschiedenen Plattformen hosten:
* **GitHub Pages:** Lade die Dateien in ein GitHub Repository hoch und aktiviere "Pages" in den Einstellungen.
* **Netlify / Vercel:** Ziehe den Ordner einfach per Drag & Drop auf die Webseite, um ihn sofort zu veröffentlichen.
* **Eigener Webspace:** Lade die Dateien per FTP auf deinen Server hoch.

## 2. Supabase Datenbank vorbereiten
Die Verbindung ist bereits im Code konfiguriert. Du musst jedoch sicherstellen, dass die Tabelle in deinem Supabase-Projekt existiert.

Führe diesen SQL-Befehl im **Supabase SQL Editor** aus:

```sql
create table highscores (
  id uuid default gen_random_uuid() primary key,
  player_name text not null,
  score integer not null,
  difficulty text not null,
  correct_answers integer not null,
  total_questions integer not null,
  created_at timestamp with time zone default now()
);

-- Aktiviere RLS (Row Level Security) oder erlaube anonyme Inserts für dieses Beispiel
alter table highscores enable row level security;

create policy "Allow anonymous inserts"
on highscores for insert
to anon
with check (true);

create policy "Allow anonymous select"
on highscores for select
to anon
using (true);
```

## 3. Link teilen
Sobald die Seite online ist (z.B. `https://dein-quiz-name.netlify.app`), kopiere den Link und poste ihn in deine Facebook-Gruppe. Die Seite ist "Responsive", das heißt sie passt sich automatisch an Smartphones (iPhone/Android) und Desktop-PCs an.

Viel Erfolg mit deinem Wrestling-Quiz!
