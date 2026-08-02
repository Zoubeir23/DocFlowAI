"use client";

import { Warp } from "@paper-design/shaders-react";
import { Check } from "lucide-react";
import { useInView } from "@/lib/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/lib/hooks/use-prefers-reduced-motion";
import { useBrandShaderPalette } from "@/lib/hooks/use-brand-shader-palette";

/**
 * Géométries du shader. Les couleurs ne sont pas figées ici : elles dérivent du
 * token `--primary` via useBrandShaderPalette, pour suivre la charte et le thème.
 */
const SHADER_GEOMETRIES = [
  {
    proportion: 0.32,
    softness: 0.9,
    distortion: 0.16,
    swirl: 0.65,
    swirlIterations: 8,
    shape: "checks" as const,
    shapeScale: 0.09,
  },
  {
    proportion: 0.42,
    softness: 1.15,
    distortion: 0.2,
    swirl: 0.85,
    swirlIterations: 11,
    shape: "stripes" as const,
    shapeScale: 0.12,
  },
  {
    proportion: 0.36,
    softness: 1,
    distortion: 0.18,
    swirl: 0.72,
    swirlIterations: 10,
    shape: "checks" as const,
    shapeScale: 0.11,
  },
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
  const { ref, isInView, hasBeenInView } = useInView<HTMLElement>();
  const prefersReducedMotion = usePrefersReducedMotion();

  const geometry = SHADER_GEOMETRIES[index % SHADER_GEOMETRIES.length];
  const { colors, gradient } = useBrandShaderPalette(index);
  // Le contexte WebGL est libéré dès que la carte s'éloigne du viewport : six
  // canvas actifs en permanence saturent inutilement le GPU et la batterie.
  const shouldRenderShader = isInView && !prefersReducedMotion;

  return (
    <article
      ref={ref}
      className="reveal-on-scroll group relative rounded-3xl overflow-hidden border border-border hover:-translate-y-1 hover:border-primary/40"
      data-in-view={hasBeenInView}
      style={{ transitionDelay: `${(index % 3) * 90}ms` }}
    >
      <div className="absolute inset-0" style={{ background: gradient }} aria-hidden="true">
        {shouldRenderShader && (
          <Warp
            style={{ width: "100%", height: "100%" }}
            proportion={geometry.proportion}
            softness={geometry.softness}
            distortion={geometry.distortion}
            swirl={geometry.swirl}
            swirlIterations={geometry.swirlIterations}
            shape={geometry.shape}
            shapeScale={geometry.shapeScale}
            scale={1}
            rotation={0}
            speed={0.5}
            colors={colors}
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
