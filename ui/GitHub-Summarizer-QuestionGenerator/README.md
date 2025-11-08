# Enhanced GitHub Repository Analyzer

A comprehensive GitHub repository analysis tool with OpenAI integration, intelligent file prioritization, and persistent storage.

## Features

### 🚀 Enhanced Repository Processing
- **Intelligent File Prioritization**: Automatically prioritizes documentation, configuration, and core source files
- **Efficient Content Filtering**: Skips binary files, build artifacts, and noise while preserving important content
- **Memory Optimization**: Processes large repositories efficiently with configurable limits

### 🧠 Advanced OpenAI Integration
- **Structured Analysis Prompts**: Generates comprehensive analysis requests with repository context
- **JSON Response Parsing**: Extracts structured insights including architecture, components, and recommendations
- **Error Handling**: Gracefully handles API failures and malformed responses

### 💾 Persistent Storage & Caching
- **SQLite Database**: Stores analysis results with metadata for future reference
- **Content Hashing**: Prevents duplicate analyses of the same repository state
- **Analysis History**: Track multiple analyses over time with timestamps

### 📊 Comprehensive Analysis Output
- **Repository Summary**: High-level overview of codebase purpose and functionality
- **Architecture Analysis**: Identifies patterns, layers, and key directories
- **Component Mapping**: Lists key classes, functions, and their relationships
- **Technology Stack Detection**: Automatic identification of frameworks and languages
- **Complexity Scoring**: 1-10 scale assessment of codebase complexity
- **Actionable Recommendations**: Specific suggestions for improvements

## Installation

```bash
cd "ui/GitHub Integration"
pip install -r requirements.txt
```

### Environment Setup

Create a `.env` file in the GitHub Integration directory:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Custom OpenAI settings
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=4000
```

## Usage

### Command Line Interface

#### Analyze a Repository
```bash
python cli_analyzer.py analyze https://github.com/user/repository

# With custom settings
python cli_analyzer.py analyze https://github.com/user/repo \
    --ref develop \
    --max-files 30 \
    --max-chars 8000 \
    --model gpt-4 \
    --output detailed_analysis.json
```

#### View Analysis History
```bash
# All analyses
python cli_analyzer.py history

# Specific repository
python cli_analyzer.py history https://github.com/user/repo
```

#### Export Analysis Results
```bash
python cli_analyzer.py export https://github.com/user/repo \
    --output analysis_export.json
```

### Programmatic Usage

```python
from github_analyzer import RepositoryAnalyzer

# Initialize analyzer
analyzer = RepositoryAnalyzer(
    max_files=25,
    max_chars_per_file=6000,
    model="gpt-4o-mini"
)

# Analyze repository
result = analyzer.analyze_repository(
    "https://github.com/user/repository", 
    ref="main"
)

# Access structured results
print(f"Summary: {result.summary}")
print(f"Tech Stack: {result.tech_stack}")
print(f"Complexity: {result.complexity_score}/10")

# Export to JSON
export_data = analyzer.export_analysis(
    "https://github.com/user/repository"
)
```

## Architecture

### Core Components

#### `RepositoryAnalyzer`
- Central orchestrator for the analysis workflow
- Manages database connections and caching
- Coordinates repository loading and OpenAI integration

#### `RepositoryMetadata`
- Structured metadata about repository analysis
- Includes file counts, type distribution, and timing information
- Used for caching and historical tracking

#### `AnalysisResult`
- Comprehensive analysis output structure
- Contains both structured data and raw OpenAI responses
- Serializable for storage and export

### File Prioritization System

Files are categorized and prioritized as follows:

1. **Priority 1**: Critical documentation (README.md, README.txt)
2. **Priority 2**: Project configuration (package.json, requirements.txt, etc.)
3. **Priority 3**: Other documentation (CONTRIBUTING.md, API docs)
4. **Priority 4**: Configuration files (config.json, settings files)
5. **Priority 5**: Main source files (main.py, index.js, app.py)
6. **Priority 6**: Other source files (.py, .js, .java, etc.)
7. **Priority 7**: Other text files (.md, .txt, .yml, etc.)

### Database Schema

```sql
CREATE TABLE repository_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_hash TEXT UNIQUE NOT NULL,
    repo_url TEXT NOT NULL,
    ref_branch TEXT NOT NULL,
    analysis_timestamp TEXT NOT NULL,
    metadata TEXT NOT NULL,           -- JSON metadata
    analysis_result TEXT NOT NULL,    -- JSON analysis result
    created_at TEXT NOT NULL
);
```

## Configuration Options

### Analyzer Settings

- `max_files`: Maximum number of files to analyze (default: 25)
- `max_chars_per_file`: Character limit per file (default: 6000) 
- `model`: OpenAI model to use (default: "gpt-4o-mini")
- `db_path`: SQLite database path (default: "analysis_results.db")

### Performance Tuning

For large repositories:
- Increase `max_files` to capture more content
- Adjust `max_chars_per_file` based on token limits
- Use faster models like "gpt-3.5-turbo" for quicker analysis

For detailed analysis:
- Use more powerful models like "gpt-4"
- Increase character limits for comprehensive content capture
- Enable `force_refresh` to re-analyze with new settings

## Error Handling

The system includes robust error handling for:

- **Git Operations**: Network issues, authentication problems, invalid repositories
- **OpenAI API**: Rate limits, authentication errors, malformed responses  
- **File Processing**: Encoding issues, binary files, permission errors
- **Database Operations**: Connection issues, schema migration, data corruption

## Testing

Run the comprehensive test suite:

```bash
python test_enhanced_analyzer.py
```

Tests cover:
- File prioritization logic
- Database operations (CRUD)
- Repository content loading
- OpenAI prompt generation
- Response parsing and error handling

## Comparison with Legacy Implementation

### Legacy (`ask_GPT.py`, `load_repo_context.py`)
- ❌ Hardcoded repository URLs and settings
- ❌ No result storage or caching
- ❌ Basic file filtering
- ❌ Simple prompting with limited context
- ❌ Plain text output only
- ❌ No error recovery

### Enhanced Implementation
- ✅ Configurable and reusable for any repository
- ✅ Persistent storage with SQLite database
- ✅ Intelligent file prioritization and filtering
- ✅ Comprehensive prompting with metadata context
- ✅ Structured JSON output with multiple data points
- ✅ Robust error handling and graceful degradation
- ✅ Command-line interface and programmatic API
- ✅ Comprehensive testing suite
- ✅ Performance optimization for large codebases

## Advanced Usage Examples

### Batch Analysis
```python
repos = [
    "https://github.com/user/repo1",
    "https://github.com/user/repo2", 
    "https://github.com/user/repo3"
]

analyzer = RepositoryAnalyzer()

for repo_url in repos:
    try:
        result = analyzer.analyze_repository(repo_url)
        print(f"✓ {repo_url}: {result.complexity_score}/10")
    except Exception as e:
        print(f"✗ {repo_url}: {e}")
```

### Custom Analysis Pipeline
```python
# Initialize with custom settings
analyzer = RepositoryAnalyzer(
    max_files=50,
    max_chars_per_file=10000,
    model="gpt-4"
)

# Analyze with forced refresh
result = analyzer.analyze_repository(
    "https://github.com/complex/repository",
    force_refresh=True
)

# Extract specific insights
if result.complexity_score and result.complexity_score > 7:
    print("⚠️ High complexity repository detected")
    print(f"Recommendations: {result.recommendations}")

# Export detailed report
with open("complex_repo_analysis.json", "w") as f:
    json.dump(result.__dict__, f, indent=2, default=str)
```

### Integration with CI/CD
```python
def analyze_pr_repository(repo_url, branch):
    """Analyze repository for pull request review."""
    analyzer = RepositoryAnalyzer()
    
    result = analyzer.analyze_repository(repo_url, ref=branch)
    
    # Generate PR comment
    comment = f"""
## 🤖 AI Repository Analysis

**Summary**: {result.summary}

**Complexity Score**: {result.complexity_score}/10

**Key Components**:
{chr(10).join([f"- {comp['name']}: {comp['purpose']}" for comp in result.key_components[:3]])}

**Recommendations**:
{chr(10).join([f"- {rec}" for rec in result.recommendations[:3]])}
    """
    
    return comment
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is part of the Prenup application suite. See the main repository for license information.