-- 0002 — Seed: Fitness niche + formation (V1)
-- Niche content is DATA, never hardcoded (AGENTS.md §2).
-- jsonb layout:
--   vocabulary       {terms[], target_examples[], avatar_styles[], banner_styles[]}
--   hook_examples    [string]
--   default_palette  [{id, name, primary, secondary}]
--   script_structures {long[], shorts[]} (names from the reference Prompt A)

insert into niches (slug, name, vocabulary, hook_examples, default_palette, script_structures)
values (
  'fitness',
  'Fitness',
  '{
    "terms": ["transformation", "sèche", "prise de masse", "cardio", "hypertrophie", "déficit calorique", "récupération"],
    "target_examples": [
      "Hommes 25-40 ans qui veulent se remettre au sport après des années d''inactivité, avec peu de temps libre.",
      "Femmes 20-35 ans qui cherchent à perdre du poids durablement sans régime extrême, entraînement à la maison."
    ],
    "avatar_styles": ["Réaliste", "Cartoon", "Mascotte", "Minimaliste"],
    "banner_styles": ["Salle de sport", "Outdoor", "Studio épuré", "Avant/Après"]
  }'::jsonb,
  '[
    "On t''a répété que courir le ventre vide brûlait deux fois plus de gras. Et si je te disais que tu perds surtout ton temps ?",
    "Tes pecs ne grossissent pas ? C''est sûrement l''une de ces trois erreurs.",
    "Ce que je vais te montrer va à l''encontre de tout ce qu''on t''a appris en salle."
  ]'::jsonb,
  '[
    {"id": "energy", "name": "Énergie", "primary": "#FF4D2E", "secondary": "#1D1D26"},
    {"id": "power", "name": "Puissance", "primary": "#FBBF24", "secondary": "#0B0B0F"},
    {"id": "fresh", "name": "Fraîcheur", "primary": "#34D399", "secondary": "#15151C"}
  ]'::jsonb,
  '{
    "long": ["Mythe Brisé", "Erreurs Fatales", "Secret Révélé", "Classement/Liste", "Transformation"],
    "shorts": ["Classement Niveau", "Liste Choc", "Liste Solution Express", "Comparaison Personnalisée", "Défi Progressif"]
  }'::jsonb
);

insert into formations (name, niche_id, monthly_message_quota, access_duration_days)
select 'Formation YouTube Fitness', id, 200, 30
from niches
where slug = 'fitness';
