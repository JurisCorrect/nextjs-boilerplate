"use client";
import { useEffect } from "react";

/**
 * Patch visuel ultra-ciblé pour les pages d'envoi :
 * - supprime "Matière"
 * - ajoute/force la zone Sujet avec la bonne hauteur + placeholder
 * - remet les helpers exacts
 * - ne fait rien sur les autres pages (accueil intact)
 */
export default function FormsPatch() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const path = window.location.pathname;

    // On ne cible QUE ces routes
    const isDissert = path === "/dissertation";
    const isCom = path === "/commentaire";
    const isCas = path === "/cas-pratique" || path === "/cas_pratique";

    if (!(isDissert || isCom || isCas)) return;

    const root = document.querySelector("main.page-wrap") || document.querySelector("main.form-page");
    if (!root) return;

    // 1) Masquer tout ce qui concerne "matiere"
    const matInput = root.querySelector<HTMLInputElement>("#matiere");
    const matLabel = root.querySelector<HTMLLabelElement>('label[for="matiere"]');
    if (matInput) matInput.closest(".field")?.setAttribute("style", "display:none !important");
    if (matLabel) matLabel.closest(".field")?.setAttribute("style", "display:none !important");

    // 2) Trouver (ou créer) le bloc "Sujet"
    const form = root.querySelector("form.form") || root.querySelector("form");
    if (!form) return;

    let subjectField = root.querySelector<HTMLDivElement>('.field:has(#sujet)');
    // :has n’est pas toujours dispo => fallback :
    if (!subjectField) {
      const existing = root.querySelector<HTMLTextAreaElement>("#sujet");
      if (existing) subjectField = existing.closest(".field") as HTMLDivElement;
    }

    if (!subjectField) {
      // Crée un champ sujet juste avant l’uploader si absent
      const uploaderField =
        root.querySelector<HTMLDivElement>(".field .uploader")?.closest(".field") ||
        form.querySelector<HTMLDivElement>(".field:last-of-type");

      const block = document.createElement("div");
      block.className = "field";

      const label = document.createElement("label");
      label.setAttribute("for", "sujet");
      label.textContent =
        isDissert ? "Sujet" :
        isCom     ? "Arrêt / Extrait" :
                    "Énoncé du cas pratique";

      const ta = document.createElement("textarea");
      ta.id = "sujet";
      ta.className = "textarea";

      block.appendChild(label);
      block.appendChild(ta);

      if (uploaderField && uploaderField.parentElement) {
        uploaderField.parentElement.insertBefore(block, uploaderField);
      } else {
        form.insertBefore(block, form.firstChild);
      }

      subjectField = block;
    }

    const textarea = subjectField.querySelector<HTMLTextAreaElement>("#sujet");
    const labelForSujet = subjectField.querySelector<HTMLLabelElement>('label[for="sujet"]');

    if (labelForSujet) {
      labelForSujet.textContent =
        isDissert ? "Sujet" :
        isCom     ? "Arrêt / Extrait" :
                    "Énoncé du cas pratique";
    }

    if (textarea) {
      // placeholders exacts
      textarea.placeholder =
        isDissert ? "Colle ton sujet ici" :
        isCom     ? "Colle ton arrêt ou extrait d'arrêt" :
                    "Colle ton énoncé de cas pratique";

      // hauteurs exactes
      const h = isDissert ? "2cm" : "3cm";
      textarea.style.height = h;
      textarea.style.minHeight = h;
      // force visuel blanc lisible
      textarea.style.background = "#ffffff";
      textarea.style.color = "var(--text, #1A1A1A)";
      textarea.style.border = "2px solid var(--border, #E5E7EB)";
      textarea.style.borderTop = "none";
      textarea.style.borderRadius = "0 0 10px 10px";
    }

    // 3) Helpers sous le titre
    const helper = root.querySelector<HTMLParagraphElement>(".helper");
    if (helper) {
      helper.textContent =
        isDissert
          ? "Indique le sujet de la dissertation, puis dépose ton document Word (.docx)."
          : isCom
          ? "Colle ton arrêt ou extrait d’arrêt, puis dépose ton document Word (.docx)."
          : "Colle ton énoncé de cas pratique, puis dépose ton document Word (.docx).";
    }

    // 4) Fond bordeaux (pas de rouge)
    root.setAttribute("style", "background: var(--brand, #6B2737) !important");
  }, []);

  return null;
}
