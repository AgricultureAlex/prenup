#!/usr/bin/env python3
"""
Command-line interface for GitHub Repository Analyzer

Usage examples:
    python cli_analyzer.py analyze https://github.com/user/repo
    python cli_analyzer.py analyze https://github.com/user/repo --ref develop
    python cli_analyzer.py history
    python cli_analyzer.py export https://github.com/user/repo --output report.json
"""

import argparse
import json
import sys
from pathlib import Path
from datetime import datetime
from github_analyzer import RepositoryAnalyzer
import logging

def setup_logging(verbose: bool = False):
    """Setup logging configuration."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

def analyze_command(args):
    """Handle repository analysis command."""
    analyzer = RepositoryAnalyzer(
        db_path=args.db_path,
        max_files=args.max_files,
        max_chars_per_file=args.max_chars,
        model=args.model,
        show_progress=True  # Enable progress indicators for CLI usage
    )
    
    try:
        print(f"Analyzing repository: {args.repo_url}")
        if args.ref != "main":
            print(f"Using branch/ref: {args.ref}")
        if hasattr(args, 'subfolder') and args.subfolder:
            print(f"Analyzing subfolder: {args.subfolder}")
            
        result = analyzer.analyze_repository(
            args.repo_url,
            args.ref,
            subfolder=getattr(args, 'subfolder', None),
            force_refresh=args.force
        )
        
        print("\n" + "="*80)
        print("ANALYSIS RESULTS")
        print("="*80)
        
        print(f"\n📊 REPOSITORY SUMMARY")
        print(f"URL: {result.repository_metadata.repo_url}")
        print(f"Branch: {result.repository_metadata.ref}")
        # Format the timestamp to be human-readable
        try:
            analysis_time = datetime.fromisoformat(result.repository_metadata.analysis_timestamp.replace('Z', '+00:00'))
            formatted_time = analysis_time.strftime('%Y-%m-%d %H:%M:%S UTC')
        except:
            formatted_time = result.repository_metadata.analysis_timestamp
            
        print(f"Files Analyzed: {result.repository_metadata.analyzed_files}/{result.repository_metadata.total_files}")
        print(f"Total Lines: {result.repository_metadata.total_lines:,}")
        print(f"Analysis Time: {formatted_time}")
        
        print(f"\n📝 SUMMARY")
        print(result.summary)
        
        if result.objectives:
            print(f"\n🎯 OBJECTIVES")
            for i, obj in enumerate(result.objectives, 1):
                print(f"{i}. {obj}")
        
        if result.tech_stack:
            print(f"\n🛠️ TECHNOLOGY STACK")
            print(", ".join(result.tech_stack))
        
        if result.key_components:
            print(f"\n🔧 KEY COMPONENTS")
            for comp in result.key_components[:5]:  # Show top 5
                print(f"• {comp.get('name', 'Unknown')} ({comp.get('type', 'Unknown')}) - {comp.get('purpose', 'No description')}")
        
        if result.architecture:
            print(f"\n🏗️ ARCHITECTURE")
            if 'pattern' in result.architecture:
                print(f"Pattern: {result.architecture['pattern']}")
            if 'layers' in result.architecture:
                print(f"Layers: {', '.join(result.architecture['layers'])}")
        
        # Complexity score display disabled
        # if result.complexity_score:
        #     print(f"\n📈 COMPLEXITY SCORE: {result.complexity_score}/10")
        
        if result.recommendations:
            print(f"\n💡 RECOMMENDATIONS")
            for i, rec in enumerate(result.recommendations, 1):
                print(f"{i}. {rec}")
        
        print(f"\n📁 FILE TYPE DISTRIBUTION")
        for ext, count in sorted(result.repository_metadata.file_types.items(), 
                               key=lambda x: x[1], reverse=True)[:10]:
            print(f"{ext}: {count} files")
            
        if args.output:
            output_path = Path(args.output)
            with open(output_path, 'w') as f:
                json.dump(result.__dict__, f, indent=2, default=str)
            print(f"\n💾 Full results saved to: {output_path}")
            
    except Exception as e:
        print(f"❌ Error during analysis: {e}", file=sys.stderr)
        sys.exit(1)

def history_command(args):
    """Handle history listing command."""
    analyzer = RepositoryAnalyzer(db_path=args.db_path, show_progress=False)
    history = analyzer.get_analysis_history(args.repo_url)
    
    if not history:
        print("No analysis history found.")
        return
    
    print("📚 ANALYSIS HISTORY")
    print("="*80)
    
    for entry in history:
        print(f"Repository: {entry['repo_url']}")
        print(f"Branch: {entry['ref_branch']}")
        if 'subfolder' in entry and entry['subfolder']:
            print(f"Subfolder: {entry['subfolder']}")
        print(f"Analyzed: {entry['analysis_timestamp']}")
        print(f"Stored: {entry['created_at']}")
        print("-" * 40)

def export_command(args):
    """Handle export command."""
    analyzer = RepositoryAnalyzer(db_path=args.db_path, show_progress=False)
    
    subfolder = getattr(args, 'subfolder', None)
    result = analyzer.export_analysis(args.repo_url, args.ref, subfolder)
    
    if not result:
        subfolder_text = f" (subfolder: {subfolder})" if subfolder else ""
        print(f"No analysis found for {args.repo_url}#{args.ref}{subfolder_text}")
        sys.exit(1)
    
    output_path = Path(args.output)
    with open(output_path, 'w') as f:
        json.dump(result, f, indent=2, default=str)
    
    print(f"Analysis exported to: {output_path}")

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="GitHub Repository Analyzer - Analyze repositories and subfolders with AI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python cli_analyzer.py analyze https://github.com/user/repo
  python cli_analyzer.py analyze https://github.com/user/repo --subfolder src/frontend
  python cli_analyzer.py history
  python cli_analyzer.py export https://github.com/user/repo --output results.json
        """
    )
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    parser.add_argument('--db-path', default='analysis_results.db', help='Path to SQLite database')
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Analyze command
    analyze_parser = subparsers.add_parser(
        'analyze',
        help='Analyze a repository or subfolder',
        formatter_class=argparse.RawTextHelpFormatter,
        description="Analyze a GitHub repository or specific subfolder with AI."
    )
    analyze_parser.add_argument('repo_url', help='GitHub repository URL')
    analyze_parser.add_argument('--ref', '-r', default='main',
                               help='Branch or tag reference (default: main)')
    analyze_parser.add_argument('--subfolder', '-s',
                               help='Subfolder path to analyze (e.g., src/frontend)')
    analyze_parser.add_argument('--force', '-f', action='store_true',
                               help='Force re-analysis even if cached result exists')
    analyze_parser.add_argument('--max-files', type=int, default=25,
                               help='Maximum files to analyze (default: 25)')
    analyze_parser.add_argument('--max-chars', type=int, default=6000,
                               help='Maximum characters per file (default: 6000)')
    analyze_parser.add_argument('--model', default='gpt-4o-mini',
                               help='OpenAI model to use (default: gpt-4o-mini)')
    analyze_parser.add_argument('--output', '-o',
                               help='Save full results to JSON file')
    analyze_parser.set_defaults(func=analyze_command)
    
    # History command
    history_parser = subparsers.add_parser('history',
                                          help='Show analysis history',
                                          formatter_class=argparse.RawTextHelpFormatter)
    history_parser.add_argument('repo_url', nargs='?',
                               help='Filter by repository URL (optional)')
    history_parser.set_defaults(func=history_command)
    
    # Export command
    export_parser = subparsers.add_parser('export',
                                         help='Export analysis results',
                                         formatter_class=argparse.RawTextHelpFormatter)
    export_parser.add_argument('repo_url', help='GitHub repository URL')
    export_parser.add_argument('--ref', '-r', default='main',
                              help='Branch or tag reference (default: main)')
    export_parser.add_argument('--subfolder', '-s',
                              help='Subfolder path that was analyzed (optional)')
    export_parser.add_argument('--output', '-o', required=True,
                              help='Output JSON file path')
    export_parser.set_defaults(func=export_command)
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    setup_logging(args.verbose)
    args.func(args)

if __name__ == '__main__':
    main()