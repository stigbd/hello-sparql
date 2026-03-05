import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PrefixesList } from '../PrefixesList';

describe('PrefixesList', () => {
  const mockPrefixes = [
    { prefix: 'rdf', namespace: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#' },
    { prefix: 'rdfs', namespace: 'http://www.w3.org/2000/01/rdf-schema#' },
    { prefix: 'owl', namespace: 'http://www.w3.org/2002/07/owl#' },
    { prefix: 'xsd', namespace: 'http://www.w3.org/2001/XMLSchema#' },
  ];

  it('renders without crashing', () => {
    render(<PrefixesList prefixes={[]} />);
    expect(screen.getByText('Available Prefixes')).toBeInTheDocument();
  });

  it('displays the header and description', () => {
    render(<PrefixesList prefixes={[]} />);
    expect(screen.getByText('Available Prefixes')).toBeInTheDocument();
    expect(
      screen.getByText('Click to copy prefix declaration. Ctrl+Click to open URL.')
    ).toBeInTheDocument();
  });

  it('renders list of prefixes', () => {
    render(<PrefixesList prefixes={mockPrefixes} />);

    expect(screen.getByText(/rdf:/)).toBeInTheDocument();
    expect(screen.getByText(/rdfs:/)).toBeInTheDocument();
    expect(screen.getByText(/owl:/)).toBeInTheDocument();
    expect(screen.getByText(/xsd:/)).toBeInTheDocument();
  });

  it('displays prefix count', () => {
    render(<PrefixesList prefixes={mockPrefixes} />);
    expect(screen.getByText('4 prefixes available')).toBeInTheDocument();
  });

  it('displays singular prefix count', () => {
    render(<PrefixesList prefixes={[mockPrefixes[0]]} />);
    expect(screen.getByText('1 prefix available')).toBeInTheDocument();
  });

  it('renders namespaces correctly', () => {
    render(<PrefixesList prefixes={mockPrefixes} />);
    expect(
      screen.getByText(/http:\/\/www.w3.org\/1999\/02\/22-rdf-syntax-ns#/)
    ).toBeInTheDocument();
    expect(screen.getByText(/http:\/\/www.w3.org\/2000\/01\/rdf-schema#/)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<PrefixesList prefixes={[]} isLoading={true} />);
    expect(screen.getByText('Loading prefixes...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const errorMessage = 'Failed to fetch prefixes';
    render(<PrefixesList prefixes={[]} error={errorMessage} />);
    expect(screen.getByText(/Failed to fetch prefixes/)).toBeInTheDocument();
  });

  it('shows empty state when no prefixes', () => {
    render(<PrefixesList prefixes={[]} />);
    expect(screen.getByText('No prefixes available')).toBeInTheDocument();
  });

  it('does not show empty state when loading', () => {
    render(<PrefixesList prefixes={[]} isLoading={true} />);
    expect(screen.queryByText('No prefixes available')).not.toBeInTheDocument();
  });

  it('does not show empty state when there is an error', () => {
    render(<PrefixesList prefixes={[]} error="Some error" />);
    expect(screen.queryByText('No prefixes available')).not.toBeInTheDocument();
  });

  it('copies prefix to clipboard when clicked', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
    });

    render(<PrefixesList prefixes={mockPrefixes} />);

    const rdfPrefix = screen.getByText(/rdf:/).closest('.prefix-item');
    expect(rdfPrefix).toBeInTheDocument();

    if (rdfPrefix) {
      await user.click(rdfPrefix);
    }

    expect(writeTextMock).toHaveBeenCalledWith(
      '@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .'
    );
  });

  it('opens namespace URL in new tab when Ctrl+Clicking', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<PrefixesList prefixes={mockPrefixes} />);

    const rdfPrefix = screen.getByText(/rdf:/).closest('.prefix-item');

    if (rdfPrefix) {
      await user.keyboard('{Control>}');
      await user.click(rdfPrefix);
      await user.keyboard('{/Control}');
    }

    expect(openSpy).toHaveBeenCalledWith('http://www.w3.org/1999/02/22-rdf-syntax-ns#', '_blank');

    openSpy.mockRestore();
  });

  it('shows "Copied!" indicator after copying', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
    });

    render(<PrefixesList prefixes={mockPrefixes} />);

    const rdfPrefix = screen.getByText(/rdf:/).closest('.prefix-item');
    if (rdfPrefix) {
      await user.click(rdfPrefix);
    }

    await waitFor(() => {
      expect(screen.getByText('✓ Copied!')).toBeInTheDocument();
    });
  });

  it('handles clipboard copy errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard error'));
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
    });

    render(<PrefixesList prefixes={mockPrefixes} />);

    const rdfPrefix = screen.getByText(/rdf:/).closest('.prefix-item');
    if (rdfPrefix) {
      await user.click(rdfPrefix);
    }

    expect(writeTextMock).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy prefix:', expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it('applies custom className', () => {
    render(<PrefixesList prefixes={[]} className="custom-class" />);
    const container = document.querySelector('.prefixes-list-wrapper');
    expect(container).toHaveClass('custom-class');
  });

  it('formats prefix text correctly', () => {
    render(<PrefixesList prefixes={mockPrefixes} />);

    const prefixItems = document.querySelectorAll('.prefix-item');
    expect(prefixItems).toHaveLength(4);

    // Check that each prefix item contains the proper formatting
    const firstItem = prefixItems[0];
    expect(firstItem.textContent).toContain('@prefix rdf:');
    expect(firstItem.textContent).toContain('<http://www.w3.org/1999/02/22-rdf-syntax-ns#>');
    expect(firstItem.textContent).toContain('.');
  });

  it('has proper title attribute for accessibility', () => {
    render(<PrefixesList prefixes={mockPrefixes} />);

    const rdfPrefix = screen.getByText(/rdf:/).closest('.prefix-item');
    expect(rdfPrefix).toHaveAttribute(
      'title',
      'Click to copy: @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\nCtrl+Click to open URL'
    );
  });

  it('renders prefix items in a scrollable container', () => {
    render(<PrefixesList prefixes={mockPrefixes} />);

    const container = document.querySelector('.prefixes-container');
    expect(container).toBeInTheDocument();
    expect(container).toHaveStyle({ maxHeight: '400px', overflowY: 'auto' });
  });

  it('handles large number of prefixes', () => {
    const manyPrefixes = Array.from({ length: 50 }, (_, i) => ({
      prefix: `prefix${i}`,
      namespace: `http://example.org/prefix${i}#`,
    }));

    render(<PrefixesList prefixes={manyPrefixes} />);

    expect(screen.getByText('50 prefixes available')).toBeInTheDocument();
    const prefixItems = document.querySelectorAll('.prefix-item');
    expect(prefixItems).toHaveLength(50);
  });

  it('can copy multiple different prefixes', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
    });

    render(<PrefixesList prefixes={mockPrefixes} />);

    const rdfPrefix = screen.getByText(/rdf:/).closest('.prefix-item');
    if (rdfPrefix) {
      await user.click(rdfPrefix);
    }
    expect(writeTextMock).toHaveBeenCalledWith(
      '@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .'
    );

    const rdfsPrefix = screen.getByText(/rdfs:/).closest('.prefix-item');
    if (rdfsPrefix) {
      await user.click(rdfsPrefix);
    }
    expect(writeTextMock).toHaveBeenCalledWith(
      '@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .'
    );

    expect(writeTextMock).toHaveBeenCalledTimes(2);
  });

  it('displays toggle tab button', () => {
    render(<PrefixesList prefixes={mockPrefixes} />);
    const toggleButton = document.querySelector('.toggle-tab');
    expect(toggleButton).toBeInTheDocument();
  });

  it('toggles icon when clicked', async () => {
    const user = userEvent.setup();
    render(<PrefixesList prefixes={mockPrefixes} />);

    const toggleButton = document.querySelector('.toggle-tab');
    expect(toggleButton).toBeInTheDocument();

    // Initially expanded (left arrow to collapse)
    expect(toggleButton?.textContent).toContain('◄');

    if (toggleButton) {
      await user.click(toggleButton);
    }

    // After click, should show right arrow to expand
    expect(toggleButton?.textContent).toContain('►');
  });

  it('applies collapsed class when clicked', async () => {
    const user = userEvent.setup();
    render(<PrefixesList prefixes={mockPrefixes} />);

    const container = document.querySelector('.prefixes-list-container');
    expect(container).not.toHaveClass('collapsed');

    const toggleButton = document.querySelector('.toggle-tab');
    if (toggleButton) {
      await user.click(toggleButton);
    }

    expect(container).toHaveClass('collapsed');
  });

  it('has correct title attribute on toggle button', () => {
    render(<PrefixesList prefixes={mockPrefixes} />);

    const toggleButton = document.querySelector('.toggle-tab');
    expect(toggleButton).toHaveAttribute('title', 'Hide prefixes');
  });

  it('maintains collapsed state across re-renders', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PrefixesList prefixes={mockPrefixes} />);

    const toggleButton = document.querySelector('.toggle-tab');
    if (toggleButton) {
      await user.click(toggleButton);
    }

    const container = document.querySelector('.prefixes-list-container');
    expect(container).toHaveClass('collapsed');

    // Re-render with updated prefixes
    rerender(
      <PrefixesList
        prefixes={[...mockPrefixes, { prefix: 'foaf', namespace: 'http://xmlns.com/foaf/0.1/' }]}
      />
    );

    // Should still be collapsed
    expect(container).toHaveClass('collapsed');
  });

  it('displays format toggle buttons', () => {
    render(<PrefixesList prefixes={mockPrefixes} />);

    expect(screen.getByText('Format:')).toBeInTheDocument();
    expect(screen.getByText('RDF')).toBeInTheDocument();
    expect(screen.getByText('SPARQL')).toBeInTheDocument();
  });

  it('defaults to RDF format', () => {
    render(<PrefixesList prefixes={mockPrefixes} />);

    const rdfButton = screen.getByText('RDF');
    expect(rdfButton).toHaveClass('active');
  });

  it('switches to SPARQL format when clicked', async () => {
    const user = userEvent.setup();
    render(<PrefixesList prefixes={mockPrefixes} />);

    const sparqlButton = screen.getByText('SPARQL');
    await user.click(sparqlButton);

    expect(sparqlButton).toHaveClass('active');
    const rdfButton = screen.getByText('RDF');
    expect(rdfButton).not.toHaveClass('active');
  });

  it('switches back to RDF format when clicked', async () => {
    const user = userEvent.setup();
    render(<PrefixesList prefixes={mockPrefixes} />);

    const sparqlButton = screen.getByText('SPARQL');
    await user.click(sparqlButton);
    expect(sparqlButton).toHaveClass('active');

    const rdfButton = screen.getByText('RDF');
    await user.click(rdfButton);
    expect(rdfButton).toHaveClass('active');
    expect(sparqlButton).not.toHaveClass('active');
  });

  it('displays prefixes in RDF format by default', () => {
    render(<PrefixesList prefixes={mockPrefixes} />);

    const prefixItems = document.querySelectorAll('.prefix-text');
    expect(prefixItems[0].textContent).toContain('@prefix rdf:');
    expect(prefixItems[0].textContent).toContain('.');
  });

  it('displays prefixes in SPARQL format when toggled', async () => {
    const user = userEvent.setup();
    render(<PrefixesList prefixes={mockPrefixes} />);

    const sparqlButton = screen.getByText('SPARQL');
    await user.click(sparqlButton);

    expect(screen.getByText(/PREFIX rdf:/)).toBeInTheDocument();
    // SPARQL format doesn't have the trailing dot
  });

  it('copies prefix in RDF format when RDF is selected', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
    });

    render(<PrefixesList prefixes={mockPrefixes} />);

    const rdfPrefix = screen.getByText(/@prefix rdf:/).closest('.prefix-item');
    if (rdfPrefix) {
      await user.click(rdfPrefix);
    }

    expect(writeTextMock).toHaveBeenCalledWith(
      '@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .'
    );
  });

  it('copies prefix in SPARQL format when SPARQL is selected', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
    });

    render(<PrefixesList prefixes={mockPrefixes} />);

    const sparqlButton = screen.getByText('SPARQL');
    await user.click(sparqlButton);

    const rdfPrefix = screen.getByText(/PREFIX rdf:/).closest('.prefix-item');
    if (rdfPrefix) {
      await user.click(rdfPrefix);
    }

    expect(writeTextMock).toHaveBeenCalledWith(
      'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>'
    );
  });

  it('maintains format selection across re-renders', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PrefixesList prefixes={mockPrefixes} />);

    const sparqlButton = screen.getByText('SPARQL');
    await user.click(sparqlButton);
    expect(sparqlButton).toHaveClass('active');

    // Re-render with updated prefixes
    rerender(
      <PrefixesList
        prefixes={[...mockPrefixes, { prefix: 'foaf', namespace: 'http://xmlns.com/foaf/0.1/' }]}
      />
    );

    // Should still be in SPARQL format
    const sparqlButtonAfter = screen.getByText('SPARQL');
    expect(sparqlButtonAfter).toHaveClass('active');
  });

  it('has correct title attributes for format buttons', () => {
    render(<PrefixesList prefixes={mockPrefixes} />);

    const rdfButton = screen.getByText('RDF');
    const sparqlButton = screen.getByText('SPARQL');

    expect(rdfButton).toHaveAttribute('title', 'RDF/Turtle format');
    expect(sparqlButton).toHaveAttribute('title', 'SPARQL format');
  });
});
