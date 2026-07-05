import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { setTemplate, render } from '../../src/lib/template.js'

function renderStr(template, data) {
  setTemplate('_', template)
  return render('_', data)
}

describe('template engine', () => {

  describe('variable substitution', () => {
    it('replaces {{key}} with string value', () => {
      assert.equal(renderStr('<p>{{name}}</p>', { name: 'Alice' }), '<p>Alice</p>')
    })

    it('replaces {{key}} with number value (coerced to string)', () => {
      assert.equal(renderStr('<p>{{count}}</p>', { count: 42 }), '<p>42</p>')
    })

    it('replaces {{key}} with zero', () => {
      assert.equal(renderStr('<p>{{n}}</p>', { n: 0 }), '<p>0</p>')
    })

    it('replaces {{key}} with false boolean', () => {
      assert.equal(renderStr('<p>{{flag}}</p>', { flag: false }), '<p>false</p>')
    })

    it('replaces {{key}} with empty string for null', () => {
      assert.equal(renderStr('<p>{{x}}</p>', { x: null }), '<p></p>')
    })

    it('replaces {{key}} with empty string for undefined', () => {
      assert.equal(renderStr('<p>{{x}}</p>', { x: undefined }), '<p></p>')
    })

    it('replaces missing key with empty string (no crash)', () => {
      assert.equal(renderStr('<p>{{missing}}</p>', {}), '<p></p>')
    })

    it('replaces multiple distinct keys', () => {
      assert.equal(
        renderStr('{{a}}-{{b}}-{{c}}', { a: 'x', b: 'y', c: 'z' }),
        'x-y-z'
      )
    })

    it('replaces same key multiple times', () => {
      assert.equal(renderStr('{{x}}{{x}}{{x}}', { x: 'A' }), 'AAA')
    })

    it('handles whitespace in tag: {{ key }}', () => {
      assert.equal(renderStr('<p>{{  name  }}</p>', { name: 'Bob' }), '<p>Bob</p>')
    })

    it('html-escapes & < > " in substituted values', () => {
      assert.equal(
        renderStr('{{unsafe}}', { unsafe: '<script>alert("x&y")</script>' }),
        '&lt;script&gt;alert(&quot;x&amp;y&quot;)&lt;/script&gt;'
      )
    })

    it('passes through text with no placeholders unchanged', () => {
      assert.equal(renderStr('hello world', {}), 'hello world')
    })

    it('handles empty template', () => {
      assert.equal(renderStr('', {}), '')
    })

    it('handles template with only placeholders', () => {
      assert.equal(renderStr('{{a}}{{b}}{{c}}', { a: '1', b: '2', c: '3' }), '123')
    })
  })

  describe('raw (unescaped) substitution {{{key}}}', () => {
    it('outputs value without HTML escaping', () => {
      assert.equal(
        renderStr('<div>{{{html}}}</div>', { html: '<script>alert(1)</script>' }),
        '<div><script>alert(1)</script></div>'
      )
    })

    it('works alongside escaped {{key}} in same template', () => {
      const result = renderStr('{{{raw}}}-{{escaped}}', {
        raw: '<b>bold</b>',
        escaped: '<b>bold</b>',
      })
      assert.equal(result, '<b>bold</b>-&lt;b&gt;bold&lt;/b&gt;')
    })

    it('handles missing raw key as empty string', () => {
      assert.equal(renderStr('{{{missing}}}', {}), '')
    })

    it('handles whitespace in raw tag: {{{  key  }}}', () => {
      assert.equal(renderStr('{{{  path  }}}', { path: '/foo/bar' }), '/foo/bar')
    })
  })

  describe('nested path resolution', () => {
    it('resolves {{a.b}} one level deep', () => {
      assert.equal(renderStr('{{user.name}}', { user: { name: 'Alice' } }), 'Alice')
    })

    it('resolves {{a.b.c}} two levels deep', () => {
      assert.equal(
        renderStr('{{a.b.c}}', { a: { b: { c: 'deep' } } }),
        'deep'
      )
    })

    it('resolves {{a.b.c.d}} three levels deep', () => {
      assert.equal(
        renderStr('{{a.b.c.d}}', { a: { b: { c: { d: 'very' } } } }),
        'very'
      )
    })

    it('returns empty for missing intermediate path', () => {
      assert.equal(renderStr('{{a.b.c}}', { a: {} }), '')
    })

    it('returns empty for null intermediate path', () => {
      assert.equal(renderStr('{{a.b.c}}', { a: { b: null } }), '')
    })
  })

  describe('{{#each}} block', () => {
    it('iterates over an array of primitives with {{this}}', () => {
      assert.equal(
        renderStr('{{#each items}}<li>{{this}}</li>{{/each}}', { items: ['a', 'b', 'c'] }),
        '<li>a</li><li>b</li><li>c</li>'
      )
    })

    it('iterates over an array of objects with {{this.prop}}', () => {
      const result = renderStr(
        '{{#each items}}<li>{{this.name}}</li>{{/each}}',
        { items: [{ name: 'Alice' }, { name: 'Bob' }] }
      )
      assert.equal(result, '<li>Alice</li><li>Bob</li>')
    })

    it('renders nothing for empty array', () => {
      assert.equal(
        renderStr('before{{#each items}}<li>{{this}}</li>{{/each}}after', { items: [] }),
        'beforeafter'
      )
    })

    it('renders nothing for non-array (no crash)', () => {
      assert.equal(
        renderStr('{{#each items}}x{{/each}}', { items: null }),
        ''
      )
    })

    it('renders nothing for undefined value (no crash)', () => {
      assert.equal(renderStr('{{#each items}}x{{/each}}', {}), '')
    })

    it('allows HTML content inside the each block', () => {
      const result = renderStr(
        '{{#each items}}<div class="{{this.cls}}">{{this.label}}</div>{{/each}}',
        { items: [{ cls: 'a', label: 'A' }, { cls: 'b', label: 'B' }] }
      )
      assert.equal(result, '<div class="a">A</div><div class="b">B</div>')
    })

    it('supports nested {{#each}} inside {{#each}} via {{this.key}}', () => {
      const result = renderStr(
        '{{#each rows}}{{#each this.cols}}{{this}}{{/each}}|{{/each}}',
        { rows: [{ cols: ['a', 'b'] }, { cols: ['c', 'd'] }] }
      )
      assert.equal(result, 'ab|cd|')
    })

    it('preserves outer data access inside each block', () => {
      const result = renderStr(
        '{{#each items}}<li>{{outer}}-{{this}}</li>{{/each}}',
        { items: ['a', 'b'], outer: 'X' }
      )
      assert.equal(result, '<li>X-a</li><li>X-b</li>')
    })
  })

  describe('{{#if}} block', () => {
    it('renders content when condition is truthy (true)', () => {
      assert.equal(
        renderStr('{{#if show}}visible{{/if}}', { show: true }),
        'visible'
      )
    })

    it('renders content when condition is truthy (non-empty string)', () => {
      assert.equal(
        renderStr('{{#if msg}}yes{{/if}}', { msg: 'hello' }),
        'yes'
      )
    })

    it('renders content when condition is truthy (number)', () => {
      assert.equal(renderStr('{{#if count}}yes{{/if}}', { count: 1 }), 'yes')
    })

    it('renders content when condition is truthy (object)', () => {
      assert.equal(renderStr('{{#if obj}}yes{{/if}}', { obj: {} }), 'yes')
    })

    it('renders content when condition is truthy (array)', () => {
      assert.equal(renderStr('{{#if arr}}yes{{/if}}', { arr: [] }), 'yes')
    })

    it('omits content when condition is false', () => {
      assert.equal(renderStr('before{{#if show}}x{{/if}}after', { show: false }), 'beforeafter')
    })

    it('omits content when condition is 0', () => {
      assert.equal(renderStr('{{#if n}}x{{/if}}', { n: 0 }), '')
    })

    it('omits content when condition is empty string', () => {
      assert.equal(renderStr('{{#if s}}x{{/if}}', { s: '' }), '')
    })

    it('omits content when condition is null', () => {
      assert.equal(renderStr('{{#if x}}x{{/if}}', { x: null }), '')
    })

    it('omits content when condition is undefined', () => {
      assert.equal(renderStr('{{#if x}}x{{/if}}', {}), '')
    })
  })

  describe('{{#if}}...{{else}}...{{/if}}', () => {
    it('renders truthy branch when condition true', () => {
      assert.equal(
        renderStr('{{#if flag}}A{{else}}B{{/if}}', { flag: true }),
        'A'
      )
    })

    it('renders else branch when condition false', () => {
      assert.equal(
        renderStr('{{#if flag}}A{{else}}B{{/if}}', { flag: false }),
        'B'
      )
    })

    it('renders else branch when condition is 0', () => {
      assert.equal(renderStr('{{#if n}}yes{{else}}no{{/if}}', { n: 0 }), 'no')
    })

    it('renders else branch when condition is empty string', () => {
      assert.equal(renderStr('{{#if s}}yes{{else}}no{{/if}}', { s: '' }), 'no')
    })

    it('renders else branch when condition is null', () => {
      assert.equal(renderStr('{{#if x}}yes{{else}}no{{/if}}', { x: null }), 'no')
    })

    it('renders else branch when condition is undefined', () => {
      assert.equal(renderStr('{{#if x}}yes{{else}}no{{/if}}', {}), 'no')
    })
  })

  describe('nested blocks', () => {
    it('{{#if this.prop}} inside {{#each}}', () => {
      const result = renderStr(
        '{{#each items}}{{#if this.active}}<li>{{this.name}}</li>{{/if}}{{/each}}',
        { items: [{ name: 'A', active: true }, { name: 'B', active: false }, { name: 'C', active: true }] }
      )
      assert.equal(result, '<li>A</li><li>C</li>')
    })

    it('{{#if this.prop}} with {{else}} inside {{#each}}', () => {
      const result = renderStr(
        '{{#each items}}{{#if this.active}}{{this.name}}✓{{else}}{{this.name}}✗{{/if}}{{/each}}',
        { items: [{ name: 'A', active: true }, { name: 'B', active: false }] }
      )
      assert.equal(result, 'A✓B✗')
    })

    it('{{#each}} inside {{#if}}', () => {
      const result = renderStr(
        '{{#if showList}}{{#each items}}<i>{{this}}</i>{{/each}}{{/if}}',
        { showList: true, items: ['a', 'b'] }
      )
      assert.equal(result, '<i>a</i><i>b</i>')
    })

    it('{{#each}} inside {{#if}} else branch', () => {
      const result = renderStr(
        '{{#if flag}}empty{{else}}{{#each items}}<i>{{this}}</i>{{/each}}{{/if}}',
        { flag: false, items: ['x', 'y'] }
      )
      assert.equal(result, '<i>x</i><i>y</i>')
    })

    it('deeply nested: if > each > if > each', () => {
      const template = '{{#if outer}}{{#each groups}}{{#if this.active}}{{#each this.items}}{{this}}{{/each}}{{/if}}{{/each}}{{/if}}'
      const data = {
        outer: true,
        groups: [
          { active: true, items: ['a', 'b'] },
          { active: false, items: ['c'] },
          { active: true, items: ['d'] },
        ],
      }
      assert.equal(renderStr(template, data), 'abd')
    })
  })

  describe('{{! comment }}', () => {
    it('strips comments from output', () => {
      assert.equal(renderStr('before{{! this is a comment }}after', {}), 'beforeafter')
    })

    it('strips multi-line comments', () => {
      assert.equal(
        renderStr('x{{! line1\nline2\nline3 }}y', {}),
        'xy'
      )
    })

    it('strips comment between variables', () => {
      assert.equal(
        renderStr('{{a}}{{! note }}{{b}}', { a: '1', b: '2' }),
        '12'
      )
    })
  })

  describe('edge cases and error handling', () => {
    it('renders template name that does not exist as empty string', () => {
      assert.equal(render('nonexistent', {}), '')
    })

    it('handles template with only comments', () => {
      assert.equal(renderStr('{{! just a comment }}', {}), '')
    })

    it('handles consecutive escaped substitutions', () => {
      assert.equal(
        renderStr('{{a}}{{b}}{{c}}', { a: 'X', b: 'Y', c: 'Z' }),
        'XYZ'
      )
    })

    it('handles mixed raw and escaped in sequence', () => {
      assert.equal(
        renderStr('{{{a}}}{{{b}}}{{c}}', { a: '<a>', b: '<b>', c: '<c>' }),
        '<a><b>&lt;c&gt;'
      )
    })

    it('html-escapes ampersand first to prevent double-escaping', () => {
      assert.equal(renderStr('{{x}}', { x: '&amp;' }), '&amp;amp;')
    })

    it('handles unclosed {{ gracefully (no crash)', () => {
      assert.equal(renderStr('hello {{world', {}), 'hello {{world')
    })
  })
})
