"use client";

import { Warp } from "@paper-design/shaders-react";
import { Check } from "lucide-react";
import { useInView } from "@/lib/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/lib/hooks/use-prefers-reduced-motion";

/** Déclinaisons du shader, toutes dérivées du teal de la charte. */
const SHADER_VARIANTS = [
  {
    proportion: 0.32,
    softness: 0.9,
    distortion: 0.16,
    swirl: 0.65,
    swirlIterations: 8,
    shape: "checks" as const,
    shapeScale: 0.09,
    colors: ["hsl(190, 70%, 14%)", "hsl(173, 80%, 30%)", "hsl(168, 62%, 52%)", "hsl(160, 55%, 72%)"],
  },
  {
    proportion: 0.42,
    softness: 1.15,
    distortion: 0.2,
    swirl: 0.85,
    swirlIterations: 11,
    shape: "dots" as const,
    shapeScale: 0.12,
    colors: ["hsl(200, 68%, 16%)", "hsl(186, 75%, 28%)", "hsl(174, 60%, 55%)", "hsl(166, 58%, 76%)"],
  },
  {
    proportion: 0.36,
    softness: 1,
    distortion: 0.18,
    swirl: 0.72,
    swirlIterations: 10,
    shape: "checks" as const,
    shapeScale: 0.11,
    colors: ["hsl(178, 72%, 13%)", "hsl(166, 78%, 30%)", "hsl(158, 58%, 54%)", "hsl(150, 52%, 74%)"],
  },
] as const;

/** Dégradé de repli, utilisé sans WebGL ou en mouvement réduit. */
const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, hsl(190 70% 14%), hsl(173 80% 30%) 55%, hsl(160 55% 72%))",
  "linear-gradient(135deg, hsl(200 68% 16%), hsl(186 75% 28%) 55%, hsl(166 58% 76%))",
  "linear-gradient(135deg, hsl(178 72% 13%), hsl(166 78% 30%) 55%, hsl(150 52% 74%))",
] as const;

interface FeatureShaderCardProps {
  title: string;
  description: string;
  bullets: string[];
  icon: React.ReactNode;
  /** Position dans la grille : choisit la déclinaison de shader et le délai d'apparition. */
  index: number;
}

/**
 * Carte de fonctionnalité sur fond de shader animé.
 *
 * Le shader n'est monté qu'une fois la carte visible, et remplacé par un
 * dégradé statique si l'utilisateur a demandé un mouvement réduit — six canvas
 * WebGL animés en permanence coûteraient inutilement en CPU et en batterie.
 */
export function FeatureShaderCard({
  title,
  description,
  bullets,
  icon,
  index,
}: FeatureShaderCardProps) {
  const { ref, isInView } = useInView<HTMLElement>();
  const prefersReducedMotion = usePrefersReducedMotion();

  const variant = SHADER_VARIANTS[index % SHADER_VARIANTS.length];
  const fallbackGradient = FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];
  const shouldRenderShader = isInView && !prefersReducedMotion;

  return (
    <article
      ref={ref}
      className={`group relative rounded-3xl overflow-hidden border border-border transition-all duration-700 hover:-translate-y-1 hover:border-primary/40 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${(index % 3) * 90}ms` }}
    >
      <div className="absolute inset-0" style={{ background: fallbackGradient }} aria-hidden="true">
        {shouldRenderShader && (
          <Warp
            style={{ width: "100%", height: "100%" }}
            proportion={variant.proportion}
            softness={variant.softness}
            distortion={variant.distortion}
            swirl={variant.swirl}
            swirlIterations={variant.swirlIterations}
            shape={variant.shape}
            shapeScale={variant.shapeScale}
            scale={1}
            rotation={0}
            speed={0.5}
            colors={[...variant.colors]}
          />
        )}
      </div>

      <div className="relative flex h-full flex-col p-8 lg:p-10 bg-card/85 backdrop-blur-[2px] transition-colors duration-500 group-hover:bg-card/80">
        <div className="mb-7 w-12 h-12 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
          {icon}
        </div>

        <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed flex-1">{description}</p>

        {bullets.length > 0 && (
          <ul className="mt-7 pt-6 border-t border-border space-y-2.5">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" strokeWidth={2.5} />
                {bullet}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
