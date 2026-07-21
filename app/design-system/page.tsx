import {
  Alert,
  Badge,
  Button,
  Card,
  CardTitle,
  Chip,
  CopyBlock,
  Field,
  Input,
  StepIndicator,
  Textarea,
} from "@/components/ui";

const colors = [
  { name: "background", className: "bg-background border border-border" },
  { name: "surface", className: "bg-surface" },
  { name: "surface-raised", className: "bg-surface-raised" },
  { name: "border", className: "bg-border" },
  { name: "accent", className: "bg-accent" },
  { name: "accent-hover", className: "bg-accent-hover" },
  { name: "accent-alt", className: "bg-accent-alt" },
  { name: "success", className: "bg-success" },
  { name: "warning", className: "bg-warning" },
  { name: "danger", className: "bg-danger" },
  { name: "info", className: "bg-info" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="border-b border-border pb-2 text-2xl font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-4 py-12">
      <header>
        <p className="mb-1 text-sm font-medium text-accent">Outil interne</p>
        <h1 className="text-4xl font-bold">Design system</h1>
        <p className="mt-2 text-fg-muted">
          Fondation visuelle de la Plateforme — tokens et primitives.
        </p>
      </header>

      <Section title="Couleurs">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {colors.map((color) => (
            <div key={color.name} className="flex flex-col gap-1.5">
              <div className={`h-14 rounded-md ${color.className}`} />
              <span className="font-mono text-xs text-fg-muted">
                {color.name}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typographie">
        <div className="flex flex-col gap-3">
          <p className="text-4xl font-bold">Display — Votre chaîne, votre voix</p>
          <h1 className="text-3xl font-bold">Titre H1 — Configurateur</h1>
          <h2 className="text-2xl font-semibold">Titre H2 — Vos scripts</h2>
          <h3 className="text-xl font-semibold">Titre H3 — Persona</h3>
          <p className="text-base text-fg">
            Corps de texte — L&apos;assistant génère vos scripts adaptés à votre
            niche et à votre audience.
          </p>
          <p className="text-sm text-fg-muted">
            Texte secondaire — Dernière activité il y a 2 heures.
          </p>
          <p className="text-xs text-fg-subtle">
            Légende — Version 3 du prompt, générée le 21 juillet 2026.
          </p>
          <p className="font-mono text-sm text-fg-muted">
            Mono — utilisé pour les blocs de prompt copiables.
          </p>
        </div>
      </Section>

      <Section title="Boutons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primaire</Button>
          <Button variant="secondary">Secondaire</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="cta">Générer mon assistant</Button>
          <Button loading>Génération…</Button>
          <Button disabled>Désactivé</Button>
          <Button size="sm">Petit</Button>
        </div>
      </Section>

      <Section title="Chips & Badges">
        <div className="flex flex-wrap items-center gap-3">
          <Chip>Musculation</Chip>
          <Chip>Perte de poids</Chip>
          <Chip selected>Nutrition</Chip>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="active">Actif</Badge>
          <Badge variant="pending">En attente</Badge>
          <Badge variant="expired">Expiré</Badge>
          <Badge variant="suspended">Suspendu</Badge>
          <Badge variant="neutral">Neutre</Badge>
        </div>
      </Section>

      <Section title="Formulaires">
        <div className="flex max-w-md flex-col gap-4">
          <Field label="Nom de la chaîne" htmlFor="channel-name" hint="Visible par votre audience.">
            <Input id="channel-name" placeholder="Ex. FitMax Coaching" />
          </Field>
          <Field
            label="Clé de licence"
            htmlFor="license"
            error="Cette clé de licence est invalide."
          >
            <Input id="license" defaultValue="XXXX-XXXX-XXXX" />
          </Field>
          <Field label="Décrivez votre cible" htmlFor="target">
            <Textarea
              id="target"
              placeholder="Ex. Hommes 25-40 ans qui veulent se remettre au sport…"
            />
          </Field>
        </div>
      </Section>

      <Section title="Progression du configurateur">
        <StepIndicator
          steps={["Cible", "Nom", "Couleurs", "Avatar", "Bannière"]}
          current={2}
        />
      </Section>

      <Section title="Alertes">
        <div className="flex flex-col gap-3">
          <Alert variant="info" title="Génération en cours">
            Votre assistant personnalisé est en cours de création, cela prend
            environ une minute.
          </Alert>
          <Alert variant="success" title="Assistant prêt">
            Votre assistant est prêt, vous pouvez commencer à générer vos
            scripts.
          </Alert>
          <Alert variant="danger" title="Quota atteint">
            Vous avez utilisé tous vos messages du mois. Le quota se
            réinitialise le 1er août.
          </Alert>
        </div>
      </Section>

      <Section title="Bloc copiable">
        <CopyBlock
          label="Prompt d'avatar"
          content={`Professional fitness coach avatar, athletic man in his 30s, confident smile, modern gym background, red and orange accent lighting, photorealistic, 4k`}
        />
      </Section>

      <Section title="Carte">
        <Card className="max-w-md">
          <div className="mb-3 flex items-center justify-between">
            <CardTitle className="mb-0">Script — 5 erreurs au squat</CardTitle>
            <Badge variant="active">Actif</Badge>
          </div>
          <p className="text-sm text-fg-muted">
            Généré le 21 juillet 2026 · commande /script · 1 240 mots
          </p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="secondary">
              Ouvrir
            </Button>
            <Button size="sm" variant="ghost">
              Historique
            </Button>
          </div>
        </Card>
      </Section>
    </main>
  );
}
