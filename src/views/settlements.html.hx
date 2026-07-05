{{#if isBalances}}
<div class="balances-section">
  <h3>Balances</h3>
  {{#if hasBalances}}
  <table class="balances-table">
    <thead>
      <tr><th>Member</th><th>Balance</th></tr>
    </thead>
    <tbody>
      {{#each balanceItems}}
      <tr><td>{{this.name}}</td><td class="{{this.cls}}">{{this.label}} &euro;{{this.amount}}</td></tr>
      {{/each}}
    </tbody>
  </table>
  {{else}}
  <p class="settled">All settled up!</p>
  {{/if}}
  <button class="btn btn-secondary" hx-get="{{{basePath}}}/api/groups/{{groupId}}/settlements" hx-target="#balances-container" hx-swap="innerHTML">View Settlements</button>
  <button class="btn btn-secondary" hx-get="{{{basePath}}}/api/groups/{{groupId}}/settlements/form" hx-target="#settlement-form-area" hx-swap="innerHTML">Record Settlement</button>
</div>
{{/if}}

{{#if isSettlements}}
<div class="settlements-section">
  <h3>Settlements</h3>
  {{#if hasSettlements}}
  <ol class="settlements-list">
    {{#each settlementItems}}
    <li>{{this.fromName}} pays {{this.toName}} &euro;{{this.amount}}</li>
    {{/each}}
  </ol>
  {{else}}
  <p class="settled">All settled up!</p>
  {{/if}}
  <button class="btn btn-secondary" hx-get="{{{basePath}}}/api/groups/{{groupId}}/balances" hx-target="#balances-container" hx-swap="innerHTML">View Raw Balances</button>
</div>
{{/if}}
