/**
 * Validation Script for Orientation Fallback Implementation
 * 
 * This script validates that the orientation fallback CSS is properly implemented
 * by checking the HTML and CSS files for required classes and styles.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, checks) {
    log(`\nChecking ${filePath}...`, 'blue');
    
    if (!fs.existsSync(filePath)) {
        log(`  ✗ File not found: ${filePath}`, 'red');
        return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    let allPassed = true;
    
    checks.forEach(check => {
        const found = check.pattern.test(content);
        if (found) {
            log(`  ✓ ${check.description}`, 'green');
        } else {
            log(`  ✗ ${check.description}`, 'red');
            allPassed = false;
        }
    });
    
    return allPassed;
}

// Validation checks
const indexHtmlChecks = [
    {
        description: 'Tailwind config includes portrait screen',
        pattern: /'portrait':\s*{\s*'raw':\s*'\(orientation:\s*portrait\)'/
    },
    {
        description: 'Tailwind config includes landscape screen',
        pattern: /'landscape':\s*{\s*'raw':\s*'\(orientation:\s*landscape\)'/
    },
    {
        description: 'Fallback CSS for unsupported browsers',
        pattern: /@supports\s+not\s+\(orientation:\s*portrait\)/
    },
    {
        description: 'Mobile fallback container styles',
        pattern: /\.mobile-fallback-container\s*{[^}]*flex-direction:\s*column\s*!important/
    },
    {
        description: 'Mobile fallback sidebar styles',
        pattern: /\.mobile-fallback-sidebar\s*{[^}]*height:\s*50vh\s*!important/
    },
    {
        description: 'Mobile fallback canvas styles',
        pattern: /\.mobile-fallback-canvas\s*{[^}]*height:\s*50vh\s*!important/
    },
    {
        description: 'Desktop override at 768px breakpoint',
        pattern: /@media\s+\(min-width:\s*768px\)\s*{[^}]*\.desktop-override/
    },
    {
        description: 'Desktop override flex-direction',
        pattern: /\.desktop-override\s*{[^}]*flex-direction:\s*row\s*!important/
    },
    {
        description: 'Custom scrollbar styles',
        pattern: /\.custom-scrollbar\s*{/
    }
];

const appTsxChecks = [
    {
        description: 'Main container has mobile-fallback-container class',
        pattern: /className="[^"]*mobile-fallback-container[^"]*"/
    },
    {
        description: 'Main container has desktop-override class',
        pattern: /className="[^"]*desktop-override[^"]*"/
    },
    {
        description: 'Sidebar has mobile-fallback-sidebar class',
        pattern: /LEFT PANEL[^<]*<div[^>]*className="[^"]*mobile-fallback-sidebar[^"]*"/s
    },
    {
        description: 'Canvas has mobile-fallback-canvas class',
        pattern: /MIDDLE\/RIGHT[^<]*<div[^>]*className="[^"]*mobile-fallback-canvas[^"]*"/s
    },
    {
        description: 'Portrait orientation classes present',
        pattern: /portrait:h-1\/2/
    },
    {
        description: 'Landscape orientation classes present',
        pattern: /landscape:h-full/
    },
    {
        description: 'Desktop breakpoint classes present',
        pattern: /md:flex-row/
    },
    {
        description: 'Transition classes for smooth orientation changes',
        pattern: /transition-all\s+duration-300/
    }
];

// Run validation
log('='.repeat(60), 'blue');
log('Orientation Fallback Implementation Validation', 'blue');
log('='.repeat(60), 'blue');

const indexHtmlPath = path.join(__dirname, 'index.html');
const appTsxPath = path.join(__dirname, 'App.tsx');

const indexHtmlPassed = checkFile(indexHtmlPath, indexHtmlChecks);
const appTsxPassed = checkFile(appTsxPath, appTsxChecks);

// Summary
log('\n' + '='.repeat(60), 'blue');
log('Validation Summary', 'blue');
log('='.repeat(60), 'blue');

if (indexHtmlPassed && appTsxPassed) {
    log('\n✓ All validation checks passed!', 'green');
    log('\nThe orientation fallback implementation is complete and correct.', 'green');
    log('\nNext steps:', 'blue');
    log('  1. Test in browser at different viewport sizes', 'yellow');
    log('  2. Test orientation changes on mobile devices', 'yellow');
    log('  3. Verify fallback behavior in older browsers', 'yellow');
    log('  4. Open test-orientation-fallback.html for interactive testing', 'yellow');
    process.exit(0);
} else {
    log('\n✗ Some validation checks failed.', 'red');
    log('\nPlease review the errors above and fix the implementation.', 'red');
    process.exit(1);
}
