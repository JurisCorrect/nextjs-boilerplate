import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small", // Plus économique que ada-002
    input: text,
    encoding_format: "float",
  })
  return response.data[0].embedding
}

async function importDocument(doc) {
  console.log(`Importation: ${doc.title}`)
  
  // Générer l'embedding du contenu
  const embedding = await generateEmbedding(doc.content)
  
  // Insérer dans Supabase
  const { error } = await supabase
    .from('knowledge_base')
    .insert({
      title: doc.title,
      content: doc.content,
      category: doc.category,
      source: doc.source,
      keywords: doc.keywords,
      embedding: embedding
    })
  
  if (error) {
    console.error('Erreur:', error)
  } else {
    console.log('✅ Importé avec succès')
  }
}

// Exemple de données à importer
const documents = [
  {
    title: "Contrôle de constitutionnalité - Article 61 Constitution",
    content: "Le Conseil constitutionnel contrôle la conformité des lois à la Constitution. Il existe deux types de contrôle : le contrôle a priori (avant promulgation) et le contrôle a posteriori (QPC)...",
    category: "constitutionnel",
    source: "Constitution française, Article 61",
    keywords: ["conseil constitutionnel", "contrôle", "QPC", "constitutionnalité"]
  },
  // Ajoutez vos 1000 pages ici...
]

// Lancer l'import
async function runImport() {
  for (const doc of documents) {
    await importDocument(doc)
    await new Promise(resolve => setTimeout(resolve, 100)) // Pause pour éviter rate limit
  }
}

runImport()
