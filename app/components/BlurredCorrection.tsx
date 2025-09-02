// === 2) components/BlurredCorrection.tsx — nouveau fichier ===
import React from 'react'


export default function BlurredCorrection({
children,
}: {
children: React.ReactNode
}) {
return (
<div className="relative">
{/* Contenu flouté (garde la justification via .correction-content) */}
<div className="correction-content blur-target">
{children}
</div>


{/* Bandeau CTA non flouté */}
<div className="absolute inset-0 flex items-end justify-center">
<div className="m-4 rounded-xl bg-white/90 p-4 shadow-lg">
<p className="mb-2 text-center text-sm">
Débloquez la correction complète ✨
</p>
{/* Ici, on placera les boutons d'achat */}
</div>
</div>
</div>
)
}
