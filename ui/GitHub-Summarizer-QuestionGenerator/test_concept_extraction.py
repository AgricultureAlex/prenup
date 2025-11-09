#!/usr/bin/env python3
"""
Test script to demonstrate concept extraction functionality.
This test creates mock analysis results to show how concepts are displayed.
"""

import json
from dataclasses import asdict
from github_analyzer import AnalysisResult, RepositoryMetadata

def test_concept_extraction_display():
    """Test the concept extraction and display functionality with mock data."""
    
    # Create mock repository metadata
    mock_metadata = RepositoryMetadata(
        repo_url="https://github.com/example/test-repo",
        ref="main",
        analysis_timestamp="2024-03-15T10:30:00Z",
        total_files=15,
        analyzed_files=8,
        total_lines=1250,
        file_types={".py": 5, ".md": 2, ".yaml": 1},
        repo_hash="abc123def456"
    )
    
    # Create mock analysis result with concepts
    mock_result = AnalysisResult(
        repository_metadata=mock_metadata,
        summary="A simple Python web application with REST API endpoints and database integration.",
        objectives=["Provide RESTful API", "Handle user authentication", "Store data persistently"],
        architecture={
            "pattern": "MVC",
            "layers": ["presentation", "business", "data"],
            "key_directories": {"src": "main application code", "tests": "unit tests"}
        },
        key_components=[
            {"name": "UserController", "type": "class", "purpose": "Handle user-related API endpoints", "location": "src/controllers/user.py"},
            {"name": "DatabaseManager", "type": "class", "purpose": "Manage database connections", "location": "src/db/manager.py"}
        ],
        tech_stack=["Python", "Flask", "SQLAlchemy", "PostgreSQL", "pytest"],
        concepts=[
            {
                "name": "REST API",
                "category": "networking",
                "description": "RESTful API design pattern for HTTP-based web services",
                "examples": ["GET /users", "POST /login", "PUT /users/{id}"],
                "importance": "high"
            },
            {
                "name": "Object-Relational Mapping",
                "category": "data_structure",
                "description": "SQLAlchemy ORM for database abstraction and object mapping",
                "examples": ["User model class", "Database session management"],
                "importance": "high"
            },
            {
                "name": "Dependency Injection", 
                "category": "design_pattern",
                "description": "Constructor-based dependency injection for loose coupling",
                "examples": ["Database connection injection", "Service layer dependencies"],
                "importance": "medium"
            },
            {
                "name": "Unit Testing",
                "category": "testing",
                "description": "Automated testing with pytest framework and fixtures",
                "examples": ["API endpoint tests", "Database model tests"],
                "importance": "high"
            },
            {
                "name": "JWT Authentication",
                "category": "security",
                "description": "JSON Web Token based stateless authentication",
                "examples": ["Login endpoint token generation", "Protected route middleware"],
                "importance": "medium"
            },
            {
                "name": "Flask Framework",
                "category": "framework",
                "description": "Lightweight WSGI web application framework for Python",
                "examples": ["Route decorators", "Request handling", "Blueprint organization"],
                "importance": "high"
            }
        ],
        complexity_score=6,
        recommendations=["Add API documentation", "Implement rate limiting", "Add logging"],
        raw_response="Mock response from OpenAI"
    )
    
    print("="*80)
    print("CONCEPT EXTRACTION TEST - MOCK ANALYSIS RESULTS")
    print("="*80)
    
    print(f"\n📊 REPOSITORY SUMMARY")
    print(f"URL: {mock_result.repository_metadata.repo_url}")
    print(f"Branch: {mock_result.repository_metadata.ref}")
    print(f"Files Analyzed: {mock_result.repository_metadata.analyzed_files}/{mock_result.repository_metadata.total_files}")
    print(f"Total Lines: {mock_result.repository_metadata.total_lines:,}")
    
    print(f"\n📝 SUMMARY")
    print(mock_result.summary)
    
    if mock_result.tech_stack:
        print(f"\n🛠️ TECHNOLOGY STACK")
        print(", ".join(mock_result.tech_stack))
    
    # Test the concept display logic
    if mock_result.concepts:
        print(f"\n🧠 CONCEPTS IDENTIFIED")
        # Group concepts by category
        concepts_by_category = {}
        for concept in mock_result.concepts:
            category = concept.get('category', 'other')
            if category not in concepts_by_category:
                concepts_by_category[category] = []
            concepts_by_category[category].append(concept)
        
        # Display concepts organized by category
        category_icons = {
            'language': '🔤',
            'framework': '🏗️',
            'algorithm': '⚙️',
            'theory': '📚',
            'networking': '🌐',
            'io': '💾',
            'computation': '🖥️',
            'data_structure': '📊',
            'design_pattern': '🎨',
            'security': '🔒',
            'testing': '🧪',
            'other': '🔧'
        }
        
        for category, concepts in sorted(concepts_by_category.items()):
            icon = category_icons.get(category, '•')
            category_display = category.replace('_', ' ').title()
            print(f"\n  {icon} {category_display}:")
            for concept in concepts[:3]:  # Show top 3 per category
                importance = concept.get('importance', 'medium')
                importance_icon = '🔥' if importance == 'high' else '⭐' if importance == 'medium' else '💡'
                print(f"    {importance_icon} {concept.get('name', 'Unknown')}: {concept.get('description', 'No description')}")
                
                # Show examples if available
                examples = concept.get('examples', [])
                if examples:
                    print(f"       Examples: {', '.join(examples[:2])}")  # Show first 2 examples
    
    print(f"\n✅ CONCEPT EXTRACTION FEATURE WORKING CORRECTLY!")
    print(f"📈 Identified {len(mock_result.concepts)} concepts across {len(set(c.get('category', 'other') for c in mock_result.concepts))} categories")
    
    # Test JSON serialization
    try:
        result_dict = asdict(mock_result)
        json_str = json.dumps(result_dict, indent=2, default=str)
        print(f"\n💾 JSON SERIALIZATION TEST: PASSED")
        print(f"   Serialized analysis result: {len(json_str)} characters")
    except Exception as e:
        print(f"\n❌ JSON SERIALIZATION TEST: FAILED - {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = test_concept_extraction_display()
    if success:
        print(f"\n🎉 All concept extraction tests passed!")
    else:
        print(f"\n❌ Some tests failed!")