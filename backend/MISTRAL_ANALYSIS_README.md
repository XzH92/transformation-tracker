# Endpoint d'Analyse Mistral

Ce document explique comment utiliser l'endpoint d'analyse Mistral pour obtenir des analyses personnalisées de vos données de transformation physique.

## Configuration

### 1. Clé API Mistral

Avant d'utiliser l'endpoint, vous devez configurer votre clé API Mistral dans le fichier `.env` :

```bash
cp .env.example .env
```

Puis éditez le fichier `.env` et remplacez la valeur par votre véritable clé API :

```env
MISTRAL_API_KEY="votre_cle_api_mistral_ici"
```

> ⚠️ **Important** : Ne partagez jamais votre clé API et ne la commitez pas dans Git.

### 2. Dépendances

Assurez-vous que toutes les dépendances sont installées :

```bash
pip install -r requirements.txt
```

## Utilisation de l'Endpoint

### URL

```
POST /analyse-mistral/
```

### Requête

**Headers** :
- `Content-Type: application/json`
- `Authorization: Bearer votre_token_jwt` (si l'authentification est activée)

**Body** (JSON) :
```json
{
    "user_prompt": "Analyse mes données de transformation physique et donne-moi des conseils personnalisés"
}
```

Le champ `user_prompt` est optionnel et a une valeur par défaut.

### Réponse

**Succès (200)** :
```json
{
    "message": "Analyse Mistral réussie",
    "analysis": {
        "id": "chatcmpl-123",
        "object": "chat.completion",
        "created": 1234567890,
        "model": "mistral-tiny",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": "Votre analyse personnalisée ici..."
                },
                "finish_reason": "stop"
            }
        ],
        "usage": {
            "prompt_tokens": 50,
            "completion_tokens": 30,
            "total_tokens": 80
        }
    },
    "data_summary": {
        "mensurations_count": 10,
        "entrainements_count": 25,
        "journal_entries_count": 15
    }
}
```

### Erreurs possibles

**400 - Bad Request** :
- Clé API Mistral non configurée
- Données manquantes ou invalides

**401 - Unauthorized** :
- Clé API Mistral invalide ou expirée

**500 - Internal Server Error** :
- Erreur lors de la communication avec l'API Mistral
- Erreur de traitement des données

## Données analysées

L'endpoint analyse les données suivantes :

1. **Mensurations** : Toutes les mesures corporelles (taille, cou, épaules, poitrine, etc.)
2. **Entraînements** : Tous les exercices, séries, répétitions et charges
3. **Journal physiologique** : Notes, humeur, énergie et qualité du sommeil

## Exemples d'utilisation

### Exemple 1 : Analyse par défaut

```bash
curl -X POST "http://localhost:8000/analyse-mistral/" \
  -H "Content-Type: application/json" \
  -d '{"user_prompt": "Analyse mes données de transformation physique"}'
```

### Exemple 2 : Analyse spécifique

```bash
curl -X POST "http://localhost:8000/analyse-mistral/" \
  -H "Content-Type: application/json" \
  -d '{"user_prompt": "Donne-moi une analyse détaillée de ma progression musculaire et des conseils pour améliorer mes performances"}'
```

### Exemple 3 : Avec JavaScript (Frontend)

```javascript
async function analyzeData() {
    try {
        const response = await fetch('http://localhost:8000/analyse-mistral/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                user_prompt: "Analyse mes données et donne-moi des conseils personnalisés pour atteindre mes objectifs"
            })
        });
        
        if (!response.ok) {
            throw new Error(`Erreur: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Analyse Mistral:', data.analysis);
        displayResults(data.analysis.choices[0].message.content);
        
    } catch (error) {
        console.error('Erreur lors de l\'analyse:', error);
        showError(error.message);
    }
}
```

## Sécurité

- **Clé API** : La clé API est stockée dans les variables d'environnement et n'est jamais exposée dans le code ou les réponses API.
- **HTTPS** : Assurez-vous d'utiliser HTTPS en production pour sécuriser les communications.
- **Authentification** : En production, protégez cet endpoint avec une authentification JWT ou similaire.

## Performances

- **Timeout** : L'appel à l'API Mistral a un timeout de 30 secondes.
- **Taille des données** : Les données sont formatées de manière optimale avant l'envoi.
- **Modèle par défaut** : Utilise `mistral-tiny` pour un bon équilibre entre qualité et coût.

## Personnalisation

Vous pouvez personnaliser le comportement en modifiant :

1. **Modèle Mistral** : Changez `"model": "mistral-tiny"` dans le code pour utiliser un autre modèle.
2. **Paramètres** : Ajustez `temperature` et `max_tokens` selon vos besoins.
3. **Format des données** : Modifiez la structure des données envoyées à Mistral dans la fonction `analyse_mistral`.

## Déploiement

Pour déployer en production :

1. Configurez la variable d'environnement `MISTRAL_API_KEY` sur votre serveur
2. Assurez-vous que le serveur a accès à internet pour appeler l'API Mistral
3. Configurez un timeout approprié pour votre serveur web
4. Activez HTTPS pour sécuriser les communications

## Support

En cas de problème :

1. Vérifiez que votre clé API Mistral est valide
2. Vérifiez que votre serveur a accès à internet
3. Consultez les logs pour plus de détails sur les erreurs
4. Assurez-vous que les données existent dans la base de données
