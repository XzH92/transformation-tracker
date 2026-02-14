#!/usr/bin/env python3
"""
Test pour vérifier le bon fonctionnement de l'endpoint Mistral.
Ce test vérifie la structure de l'endpoint sans faire d'appel réel à l'API Mistral.
"""

import os
import sys
from datetime import date
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

# Ajouter le chemin du projet
sys.path.append('.')

# Configurer l'environnement de test
os.environ['MISTRAL_API_KEY'] = 'test_api_key'

from main import app, MistralAnalysisRequest
from models import Base, engine, SessionLocal, Mensuration, Entrainement, JournalPhysiologique

# Créer les tables pour le test
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_mistral_analysis_request_model():
    """Test du modèle Pydantic MistralAnalysisRequest"""
    print("Testing MistralAnalysisRequest model...")
    
    # Test avec le prompt par défaut
    request1 = MistralAnalysisRequest()
    assert request1.user_prompt == "Analyse mes données de transformation physique et donne-moi des conseils personnalisés"
    
    # Test avec un prompt personnalisé
    request2 = MistralAnalysisRequest(user_prompt="Donne-moi une analyse détaillée de ma progression")
    assert request2.user_prompt == "Donne-moi une analyse détaillée de ma progression"
    
    print("✓ MistralAnalysisRequest model test passed")

def test_mistral_endpoint_exists():
    """Test que l'endpoint existe et est accessible"""
    print("Testing Mistral endpoint existence...")
    
    # Vérifier que la route existe - devrait retourner une erreur 401 car la clé API n'est pas valide
    response = client.post("/analyse-mistral/", json={"user_prompt": "test"})
    
    # Should get an error (API key issue)
    assert response.status_code == 401
    assert "Unauthorized" in response.json()["detail"]
    
    print("✓ Mistral endpoint exists")

def test_mistral_endpoint_with_mock_data():
    """Test l'endpoint avec des données mockées"""
    print("Testing Mistral endpoint with mock data...")
    
    # Créer une session de test
    db = SessionLocal()
    
    try:
        # Ajouter des données de test
        test_mensuration = Mensuration(
            date=date(2023, 1, 1),
            taille=80.0,
            cou=40.0,
            epaules=120.0,
            poitrine=100.0,
            nombril=90.0,
            hanches=100.0,
            biceps_gauche=35.0,
            biceps_droit=35.5,
            cuisse_gauche=60.0,
            cuisse_droite=60.5,
            mollet_gauche=40.0,
            mollet_droit=40.5
        )
        
        test_entrainement = Entrainement(
            date=date(2023, 1, 1),
            exercice="Squat",
            series=4,
            reps=8,
            charge=100.0,
            rpe=8.0,
            notes="Bon entraînement"
        )
        
        test_journal = JournalPhysiologique(
            date=date(2023, 1, 1),
            texte="Première journée de suivi",
            humeur=8,
            energie=7,
            sommeil_qualite=8,
            sommeil_duree=7.5
        )
        
        db.add(test_mensuration)
        db.add(test_entrainement)
        db.add(test_journal)
        db.commit()
        
        # Mock de la réponse Mistral
        mock_mistral_response = {
            "id": "chatcmpl-test",
            "object": "chat.completion",
            "created": 1234567890,
            "model": "mistral-tiny",
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": "Analyse de test réussie. Vos données montrent une bonne progression."
                    },
                    "finish_reason": "stop"
                }
            ],
            "usage": {
                "prompt_tokens": 50,
                "completion_tokens": 30,
                "total_tokens": 80
            }
        }
        
        # Patcher la fonction call_mistral_api
        with patch('main.call_mistral_api', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = mock_mistral_response
            
            # Appeler l'endpoint
            response = client.post(
                "/analyse-mistral/",
                json={"user_prompt": "Analyse mes données"}
            )
            
            # Vérifier la réponse
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            assert "Analyse Mistral réussie" in data["message"]
            assert "analysis" in data
            assert "data_summary" in data
            
            # Vérifier que call_mistral_api a été appelé
            mock_call.assert_called_once()
            
            print("✓ Mistral endpoint with mock data test passed")
            
    finally:
        # Nettoyer les données de test
        db.query(Mensuration).delete()
        db.query(Entrainement).delete()
        db.query(JournalPhysiologique).delete()
        db.commit()
        db.close()

def test_mistral_endpoint_error_handling():
    """Test la gestion des erreurs de l'endpoint"""
    print("Testing Mistral endpoint error handling...")
    
    # Tester sans clé API
    with patch.dict(os.environ, {'MISTRAL_API_KEY': ''}):
        response = client.post(
            "/analyse-mistral/",
            json={"user_prompt": "test"}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "Clé API Mistral non configurée" in data["detail"]
    
    print("✓ Mistral endpoint error handling test passed")

if __name__ == "__main__":
    print("Running Mistral endpoint tests...\n")
    
    test_mistral_analysis_request_model()
    test_mistral_endpoint_exists()
    test_mistral_endpoint_with_mock_data()
    test_mistral_endpoint_error_handling()
    
    print("\n✓ All tests passed!")
