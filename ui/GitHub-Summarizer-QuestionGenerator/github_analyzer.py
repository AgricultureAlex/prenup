"""
Enhanced GitHub Repository Analyzer with OpenAI Integration

This module provides comprehensive GitHub repository analysis with intelligent
content structuring, efficient OpenAI API usage, and persistent storage.
"""

import os
import json
import hashlib
import tempfile
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import sqlite3
import logging

from dotenv import load_dotenv
from agents import Agent, Runner
from progress_indicators import LoadingSpinner, ProgressBar, no_progress_context

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class RepositoryMetadata:
    """Metadata about a repository analysis."""
    repo_url: str
    ref: str
    analysis_timestamp: str
    total_files: int
    analyzed_files: int
    total_lines: int
    file_types: Dict[str, int]
    repo_hash: str
    subfolder: Optional[str] = None

@dataclass
class AnalysisResult:
    """Structure for OpenAI analysis results."""
    repository_metadata: RepositoryMetadata
    summary: str
    objectives: List[str]
    architecture: Dict[str, Any]
    key_components: List[Dict[str, str]]
    tech_stack: List[str]
    concepts: List[Dict[str, Any]]
    complexity_score: Optional[int]
    recommendations: List[str]
    raw_response: str

class RepositoryAnalyzer:
    """Enhanced repository analyzer with OpenAI integration and storage."""
    
    def __init__(self,
                 db_path: str = "analysis_results.db",
                 max_files: int = 25,
                 max_chars_per_file: int = 6000,
                 model: str = "gpt-4o-mini",
                 show_progress: bool = False):
        """
        Initialize the repository analyzer.
        
        Args:
            db_path: Path to SQLite database for storing results
            max_files: Maximum number of files to analyze
            max_chars_per_file: Maximum characters per file
            model: OpenAI model to use
            show_progress: Whether to show progress indicators (useful for CLI)
        """
        self.db_path = db_path
        self.max_files = max_files
        self.max_chars_per_file = max_chars_per_file
        self.model = model
        self.show_progress = show_progress
        self._init_database()
        
    def _init_database(self):
        """Initialize SQLite database for storing analysis results."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS repository_analyses (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    repo_hash TEXT UNIQUE NOT NULL,
                    repo_url TEXT NOT NULL,
                    ref_branch TEXT NOT NULL,
                    subfolder TEXT,
                    analysis_timestamp TEXT NOT NULL,
                    metadata TEXT NOT NULL,
                    analysis_result TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_repo_hash ON repository_analyses(repo_hash)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_repo_url ON repository_analyses(repo_url)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_subfolder ON repository_analyses(subfolder)
            """)

    def _generate_repo_hash(self, repo_url: str, ref: str, subfolder: Optional[str] = None) -> str:
        """Generate a hash for caching based on repo URL, ref, and subfolder."""
        content = f"{repo_url}#{ref}"
        if subfolder:
            content += f"@{subfolder}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]

    def _clone_repo_to_tmp(self, repo_url: str, ref: str = "main") -> Path:
        """Clone a GitHub repository to a temporary directory."""
        tmp_dir = Path(tempfile.mkdtemp(prefix="repo-analysis-"))
        
        progress_ctx = LoadingSpinner(
            f"Cloning repository {repo_url}#{ref}"
        ) if self.show_progress else no_progress_context()
        
        try:
            with progress_ctx:
                subprocess.run(
                    ["git", "clone", "--depth", "1", "--branch", ref, repo_url, str(tmp_dir)],
                    check=True,
                    capture_output=True,
                    text=True
                )
                logger.info(f"Successfully cloned {repo_url}#{ref} to {tmp_dir}")
                
            if self.show_progress:
                progress_ctx.stop(f"Repository cloned successfully")
            return tmp_dir
        except subprocess.CalledProcessError as e:
            if self.show_progress:
                progress_ctx.stop()
                print(f"✗ Failed to clone repository: {e.stderr}")
            logger.error(f"Failed to clone repository: {e.stderr}")
            raise

    def _is_important_file(self, path: Path, subfolder_depth: int = 0) -> Tuple[bool, int]:
        """
        Determine if a file is important for analysis and assign priority.
        
        Args:
            path: File path relative to repository root or subfolder
            subfolder_depth: Depth of subfolder being analyzed (used for priority adjustment)
        
        Returns:
            (is_important, priority) where lower priority numbers = higher importance
        """
        filename = path.name.lower()
        suffix = path.suffix.lower()
        parts = [p.lower() for p in path.parts]
        
        # Skip these directories entirely
        skip_dirs = {'.git', 'node_modules', 'dist', 'build', '.next',
                    '.cache', '__pycache__', '.venv', 'venv', 'env'}
        if any(part in skip_dirs for part in parts):
            return False, 999
            
        # Skip binary and generated files
        skip_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.pdf', '.exe',
                          '.zip', '.tar', '.gz', '.bin', '.so', '.dll', '.dylib'}
        if suffix in skip_extensions:
            return False, 999
            
        # Priority 1: Critical documentation (adjust for subfolder context)
        if filename in {'readme.md', 'readme.txt', 'readme.rst', 'readme'}:
            # README in subfolder is slightly less priority than root README
            return True, 1 + min(subfolder_depth, 1)
            
        # Priority 2: Important project files (less critical in subfolders)
        important_files = {'package.json', 'requirements.txt', 'pyproject.toml',
                          'cargo.toml', 'go.mod', 'pom.xml', 'build.gradle',
                          'composer.json', 'gemfile', 'setup.py', 'setup.cfg'}
        # Check if it's a project file at the current level (not necessarily root)
        if len(parts) <= 2 and filename in important_files:
            return True, 2 + subfolder_depth
            
        # Priority 3: Other documentation
        doc_files = {'contributing.md', 'license', 'license.md', 'changelog.md',
                    'api.md', 'docs.md', 'getting-started.md'}
        if filename in doc_files or any(part in {'docs', 'doc'} for part in parts[:-1]):
            if suffix in {'.md', '.txt', '.rst'}:
                return True, 3
                
        # Priority 4: Configuration files
        if filename.endswith('.config.js') or filename in {'config.json', 'settings.json'}:
            return True, 4
            
        # Priority 5: Main source files
        main_patterns = {'main', 'index', 'app', '__init__', 'server'}
        if any(pattern in filename for pattern in main_patterns):
            if suffix in {'.py', '.js', '.ts', '.java', '.go', '.rs', '.cpp', '.c'}:
                return True, 5
                
        # Priority 6: Other source files
        source_extensions = {'.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go',
                           '.rs', '.cpp', '.c', '.h', '.hpp', '.cs', '.php',
                           '.rb', '.swift', '.kt', '.dart'}
        if suffix in source_extensions:
            return True, 6
            
        # Priority 7: Other text files
        if suffix in {'.md', '.txt', '.yml', '.yaml', '.json', '.xml', '.toml', '.ini'}:
            return True, 7
            
        return False, 999

    def _analyze_file_types(self, files: List[Path]) -> Dict[str, int]:
        """Analyze distribution of file types."""
        type_counts = {}
        for file_path in files:
            ext = file_path.suffix.lower() or 'no_extension'
            type_counts[ext] = type_counts.get(ext, 0) + 1
        return type_counts

    def _load_repository_context(self, repo_url: str, ref: str = "main", subfolder: Optional[str] = None) -> Tuple[List[Dict], RepositoryMetadata]:
        """
        Load repository contents with intelligent file selection and metadata.
        
        Args:
            repo_url: GitHub repository URL
            ref: Branch or tag reference
            subfolder: Optional subfolder path to analyze
        
        Returns:
            (context_chunks, metadata)
        """
        repo_path = self._clone_repo_to_tmp(repo_url, ref)
        repo_hash = self._generate_repo_hash(repo_url, ref, subfolder)
        
        try:
            # Determine analysis path
            if subfolder:
                analysis_path = repo_path / subfolder
                if not analysis_path.exists():
                    raise ValueError(f"Subfolder '{subfolder}' does not exist in repository")
                if not analysis_path.is_dir():
                    raise ValueError(f"Subfolder '{subfolder}' is not a directory")
                logger.info(f"Analyzing subfolder: {subfolder}")
            else:
                analysis_path = repo_path
                logger.info("Analyzing entire repository")
            
            # Calculate subfolder depth for priority adjustment
            subfolder_depth = len(subfolder.split('/')) if subfolder else 0
            
            # Collect all files with priority scoring
            scope_text = f"subfolder '{subfolder}'" if subfolder else "repository"
            progress_ctx = LoadingSpinner(
                f"Scanning and prioritizing files in {scope_text}"
            ) if self.show_progress else no_progress_context()
            
            file_priority_pairs = []
            total_lines = 0
            
            with progress_ctx:
                for path in analysis_path.rglob("*"):
                    if path.is_file():
                        # Calculate relative path from analysis root for priority scoring
                        try:
                            relative_from_analysis = path.relative_to(analysis_path)
                            is_important, priority = self._is_important_file(relative_from_analysis, subfolder_depth)
                            if is_important:
                                file_priority_pairs.append((path, priority))
                                
                                # Count lines for metadata
                                try:
                                    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                                        total_lines += sum(1 for _ in f)
                                except:
                                    pass  # Skip files that can't be read
                        except ValueError:
                            # Skip files that can't be made relative to analysis path
                            continue
                            
            if self.show_progress:
                progress_ctx.stop(f"Found {len(file_priority_pairs)} analyzable files")
            
            # Sort by priority and limit
            file_priority_pairs.sort(key=lambda x: x[1])
            selected_files = [fp[0] for fp in file_priority_pairs[:self.max_files]]
            
            # Build context chunks with progress
            if self.show_progress and selected_files:
                file_progress = ProgressBar(len(selected_files), "Loading file contents")
            
            context_chunks = []
            for i, file_path in enumerate(selected_files):
                try:
                    content = file_path.read_text(encoding='utf-8', errors='ignore')
                    trimmed_content = content[:self.max_chars_per_file]
                    
                    # Create path relative to the original repo root for context
                    relative_path = str(file_path.relative_to(repo_path))
                    
                    context_chunks.append({
                        "path": relative_path,
                        "content": trimmed_content,
                        "size": len(content),
                        "truncated": len(content) > self.max_chars_per_file
                    })
                    
                    if self.show_progress:
                        file_progress.update()
                        
                except Exception as e:
                    logger.warning(f"Could not read file {file_path}: {e}")
                    if self.show_progress:
                        file_progress.update()
            
            if self.show_progress and selected_files:
                file_progress.finish(f"Loaded {len(context_chunks)} files successfully")
            
            # Create metadata
            all_files = [fp[0] for fp in file_priority_pairs]
            file_types = self._analyze_file_types(all_files)
            
            metadata = RepositoryMetadata(
                repo_url=repo_url,
                ref=ref,
                analysis_timestamp=datetime.now(timezone.utc).isoformat(),
                total_files=len(all_files),
                analyzed_files=len(context_chunks),
                total_lines=total_lines,
                file_types=file_types,
                repo_hash=repo_hash,
                subfolder=subfolder
            )
            
            scope_text = f"subfolder '{subfolder}'" if subfolder else "repository"
            logger.info(f"Loaded {len(context_chunks)}/{len(all_files)} files for {scope_text} analysis")
            return context_chunks, metadata
            
        finally:
            # Cleanup temp directory
            import shutil
            shutil.rmtree(repo_path, ignore_errors=True)

    def _create_analysis_prompt(self, context_chunks: List[Dict], metadata: RepositoryMetadata) -> str:
        """Create a comprehensive analysis prompt for OpenAI."""
        
        # Build file listing with context
        file_listing = "\n".join([
            f"FILE: {chunk['path']} ({chunk['size']} bytes{'*truncated' if chunk['truncated'] else ''})"
            for chunk in context_chunks
        ])
        
        # Build full content
        codebase_content = "\n\n".join([
            f"=== FILE: {chunk['path']} ===\n{chunk['content']}"
            for chunk in context_chunks
        ])
        
        # Determine analysis scope description
        scope_description = f"subfolder '{metadata.subfolder}'" if metadata.subfolder else "entire repository"
        analysis_context = f"This analysis focuses on the {scope_description} of the repository."
        
        prompt = f"""
You are an expert software architect analyzing a codebase. Please provide a comprehensive analysis of this {scope_description}.

ANALYSIS SCOPE: {analysis_context}

REPOSITORY METADATA:
- URL: {metadata.repo_url}
- Branch/Ref: {metadata.ref}
{f"- Subfolder: {metadata.subfolder}" if metadata.subfolder else ""}
- Total Files in Scope: {metadata.total_files}
- Analyzed Files: {metadata.analyzed_files}
- Total Lines of Code: {metadata.total_lines}
- File Types: {json.dumps(metadata.file_types, indent=2)}

FILES ANALYZED:
{file_listing}

CODEBASE CONTENTS:
{codebase_content}

Please analyze this codebase and provide a response in the following JSON format:

{{
    "summary": "Brief 2-3 sentence summary of what this {scope_description} does",
    "objectives": ["Main objective 1", "Main objective 2", "..."],
    "architecture": {{
        "pattern": "Architecture pattern used (MVC, microservices, etc.)",
        "layers": ["layer1", "layer2", "..."],
        "key_directories": {{"directory": "purpose description"}}
    }},
    "key_components": [
        {{"name": "ComponentName", "type": "class/function/module", "purpose": "what it does", "location": "file path"}},
        ...
    ],
    "tech_stack": ["technology1", "technology2", "..."],
    "concepts": [
        {{"name": "ConceptName", "category": "language|framework|algorithm|theory|networking|io|computation|data_structure|design_pattern|security|testing|other", "description": "Brief description of the concept and how it's used", "examples": ["specific usage example 1", "specific usage example 2"], "importance": "high|medium|low"}},
        ...
    ],
    "complexity_score": 1-10,
    "recommendations": ["improvement suggestion 1", "improvement suggestion 2", "..."]
}}

Focus on:
1. The overall purpose and functionality of this {scope_description}
2. Key architectural patterns and design decisions
3. Main components and how they interact
4. Technology stack and dependencies
5. Programming concepts, algorithms, theories, and technical patterns used
6. Code quality and potential improvements
7. Scalability considerations
{f"8. How this subfolder fits within the larger repository structure" if metadata.subfolder else ""}

For the concepts section, identify and categorize important technical concepts found in the code:
- Programming languages and their specific features used
- Frameworks, libraries, and tools employed
- Algorithms and data structures implemented
- Software engineering principles and design patterns
- Networking protocols and communication methods
- I/O operations and data handling approaches
- Low-level computation concepts if applicable
- Security practices and authentication methods
- Testing methodologies and quality assurance
- Any other significant technical concepts

Provide specific, actionable insights based on the actual code structure and content.
"""
        return prompt

    def _parse_openai_response(self, raw_response: str, metadata: RepositoryMetadata) -> AnalysisResult:
        """Parse OpenAI response into structured format."""
        try:
            # Try to extract JSON from the response
            import re
            json_match = re.search(r'\{.*\}', raw_response, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group())
            else:
                # Fallback to basic parsing
                parsed = {
                    "summary": raw_response[:200] + "..." if len(raw_response) > 200 else raw_response,
                    "objectives": [],
                    "architecture": {},
                    "key_components": [],
                    "tech_stack": [],
                    "concepts": [],
                    "complexity_score": None,
                    "recommendations": []
                }
                
            return AnalysisResult(
                repository_metadata=metadata,
                summary=parsed.get("summary", ""),
                objectives=parsed.get("objectives", []),
                architecture=parsed.get("architecture", {}),
                key_components=parsed.get("key_components", []),
                tech_stack=parsed.get("tech_stack", []),
                concepts=parsed.get("concepts", []),
                complexity_score=parsed.get("complexity_score"),
                recommendations=parsed.get("recommendations", []),
                raw_response=raw_response
            )
        except Exception as e:
            logger.error(f"Error parsing OpenAI response: {e}")
            # Return basic result with raw response
            return AnalysisResult(
                repository_metadata=metadata,
                summary="Analysis completed but could not parse structured response",
                objectives=[],
                architecture={},
                key_components=[],
                tech_stack=[],
                concepts=[],
                complexity_score=None,
                recommendations=[],
                raw_response=raw_response
            )

    def analyze_repository(self, repo_url: str, ref: str = "main", subfolder: Optional[str] = None, force_refresh: bool = False) -> AnalysisResult:
        """
        Analyze a GitHub repository or subfolder using OpenAI.
        
        Args:
            repo_url: GitHub repository URL
            ref: Branch or tag reference
            subfolder: Optional subfolder path to analyze
            force_refresh: Force re-analysis even if cached result exists
            
        Returns:
            AnalysisResult object containing structured analysis
        """
        repo_hash = self._generate_repo_hash(repo_url, ref, subfolder)
        
        # Check for existing analysis
        if not force_refresh:
            existing = self._get_stored_analysis(repo_hash)
            if existing:
                scope_text = f"subfolder '{subfolder}'" if subfolder else "repository"
                logger.info(f"Using cached analysis for {repo_url}#{ref} ({scope_text})")
                return existing
        
        scope_text = f"subfolder '{subfolder}'" if subfolder else "repository"
        logger.info(f"Starting analysis of {repo_url}#{ref} ({scope_text})")
        
        try:
            # Load repository context
            context_chunks, metadata = self._load_repository_context(repo_url, ref, subfolder)
            
            if not context_chunks:
                scope_error = f"subfolder '{subfolder}'" if subfolder else "repository"
                raise ValueError(f"No analyzable files found in {scope_error}")
            
            # Create analysis prompt
            prompt = self._create_analysis_prompt(context_chunks, metadata)
            
            # Run OpenAI analysis with progress indicator
            agent = Agent(
                model=self.model,
                name="Advanced Codebase Analyzer",
                instructions=prompt
            )
            
            logger.info("Sending request to OpenAI...")
            
            analysis_progress_ctx = LoadingSpinner(
                f"Analyzing {scope_text} with {self.model}"
            ) if self.show_progress else no_progress_context()
            
            with analysis_progress_ctx:
                result = Runner.run_sync(agent, prompt, context=context_chunks)
                raw_response = result.final_output
                
            if self.show_progress:
                analysis_progress_ctx.stop(f"Analysis completed by {self.model}")
            
            # Parse response
            analysis_result = self._parse_openai_response(raw_response, metadata)
            
            # Store result
            self._store_analysis_result(analysis_result)
            
            logger.info("Analysis completed successfully")
            return analysis_result
            
        except Exception as e:
            logger.error(f"Error during repository analysis: {e}")
            raise

    def _store_analysis_result(self, analysis: AnalysisResult):
        """Store analysis result in database."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO repository_analyses
                (repo_hash, repo_url, ref_branch, subfolder, analysis_timestamp, metadata, analysis_result, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                analysis.repository_metadata.repo_hash,
                analysis.repository_metadata.repo_url,
                analysis.repository_metadata.ref,
                analysis.repository_metadata.subfolder,
                analysis.repository_metadata.analysis_timestamp,
                json.dumps(asdict(analysis.repository_metadata)),
                json.dumps(asdict(analysis)),
                datetime.now(timezone.utc).isoformat()
            ))
            
    def _get_stored_analysis(self, repo_hash: str) -> Optional[AnalysisResult]:
        """Retrieve stored analysis result."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    SELECT analysis_result FROM repository_analyses 
                    WHERE repo_hash = ?
                """, (repo_hash,))
                row = cursor.fetchone()
                
                if row:
                    analysis_data = json.loads(row[0])
                    # Reconstruct AnalysisResult
                    metadata_data = analysis_data['repository_metadata']
                    metadata = RepositoryMetadata(**metadata_data)
                    analysis_data['repository_metadata'] = metadata
                    return AnalysisResult(**analysis_data)
                    
        except Exception as e:
            logger.error(f"Error retrieving stored analysis: {e}")
        return None

    def get_analysis_history(self, repo_url: Optional[str] = None) -> List[Dict]:
        """Get history of analyses."""
        with sqlite3.connect(self.db_path) as conn:
            if repo_url:
                cursor = conn.execute("""
                    SELECT repo_url, ref_branch, subfolder, analysis_timestamp, created_at
                    FROM repository_analyses
                    WHERE repo_url = ?
                    ORDER BY created_at DESC
                """, (repo_url,))
            else:
                cursor = conn.execute("""
                    SELECT repo_url, ref_branch, subfolder, analysis_timestamp, created_at
                    FROM repository_analyses
                    ORDER BY created_at DESC
                """)
            
            return [
                {
                    'repo_url': row[0],
                    'ref_branch': row[1],
                    'subfolder': row[2],
                    'analysis_timestamp': row[3],
                    'created_at': row[4]
                }
                for row in cursor.fetchall()
            ]

    def export_analysis(self, repo_url: str, ref: str = "main", subfolder: Optional[str] = None) -> Optional[Dict]:
        """Export analysis result as dictionary."""
        repo_hash = self._generate_repo_hash(repo_url, ref, subfolder)
        analysis = self._get_stored_analysis(repo_hash)
        return asdict(analysis) if analysis else None