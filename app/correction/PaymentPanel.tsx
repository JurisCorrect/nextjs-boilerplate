const startCheckout = async (mode: "payment" | "subscription") => {
  alert("1. Début du processus")
  
  try {
    setLoading(mode === "payment" ? "one" : "sub")
    alert("2. Loading activé")
    
    const res = await fetch("/api/checkout", { /* ... */ })
    alert("3. Fetch terminé, status: " + res.status)
    
    const data = await res.json()
    alert("4. Data reçue: " + JSON.stringify(data))
    
    if (!res.ok || !data?.url) {
      alert("5. ERREUR dans la réponse")
      throw new Error(data?.error || "Erreur Checkout")
    }
    
    alert("6. REDIRECTION VERS: " + data.url)
    
  } catch (e) {
    alert("7. ERREUR: " + e.message)
  }
}
