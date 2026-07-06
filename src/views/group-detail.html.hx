<div id="group-detail-area">
  <div class="group-detail">
    <header class="group-header">
      <h2>{{group.name}}</h2>
      <p class="member-count">{{memberCount}} {{memberLabel}}</p>
      <a href="#/" class="back-link" hx-get="{{{basePath}}}/api/groups" hx-target="#main-content" hx-push-url="/#/">&larr; Back</a>
    </header>
    <nav class="group-actions">
      <button class="btn btn-primary" hx-get="{{{basePath}}}/api/groups/{{group.id}}/members/form" hx-target="#member-form-area" hx-swap="innerHTML">Add Member</button>
      <button class="btn btn-primary" hx-get="{{{basePath}}}/api/groups/{{group.id}}/expenses/form" hx-target="#expense-form-area" hx-swap="innerHTML">Add Expense</button>
      <button class="btn btn-secondary" hx-get="{{{basePath}}}/api/groups/{{group.id}}/balances" hx-target="#balances-container" hx-swap="innerHTML">Balances</button>
      <button class="btn btn-secondary" hx-get="{{{basePath}}}/api/groups/{{group.id}}/settlements/form" hx-target="#settlement-form-area" hx-swap="innerHTML">Record Settlement</button>
    </nav>
    <div id="member-form-area"></div>
    <div id="expense-form-area"></div>
    <div id="settlement-form-area"></div>
    <section class="members-section">
      <h3>Members</h3>
      {{#if hasMembers}}
      <ul class="member-list">
        {{#each members}}
        <li>{{this.name}}</li>
        {{/each}}
      </ul>
      {{else}}
      <p class="empty">No members yet.</p>
      {{/if}}
    </section>
    <section class="expenses-section">
      <h3>Expenses</h3>
      {{#if hasExpenses}}
      <ul class="expense-list">
        {{#each expenses}}
        <li class="expense-item">
          <span class="expense-info"><strong>{{this.description}}</strong> &mdash; &euro;{{this.totalFormatted}} paid by {{this.payerNames}}</span>
          <button class="btn btn-danger btn-sm btn-icon" hx-post="{{{basePath}}}/api/groups/{{group.id}}/expenses/{{this.id}}/delete" hx-target="#group-detail-area" hx-swap="outerHTML" hx-confirm="Delete this expense? It will be removed from balances.">&times;</button>
        </li>
        {{/each}}
      </ul>
      {{else}}
      <p class="empty">No expenses yet.</p>
      {{/if}}
    </section>
    <section class="balances-section">
      <h3>Balance Snapshot</h3>
      {{#if hasBalances}}
      <ul class="balance-list">
        {{#each balanceItems}}
        <li class="{{this.cls}}">{{this.name}} {{this.label}} &euro;{{this.amount}}</li>
        {{/each}}
      </ul>
      {{else}}
      <p class="settled">All settled up!</p>
      {{/if}}
    </section>
    <div id="balances-container"></div>
    <section class="settlement-history-section">
      <h3>Settlement History</h3>
      {{#if hasSettlementHistory}}
      <table class="settlement-history-table">
        <thead>
          <tr><th>Date</th><th>From</th><th>To</th><th>Amount</th><th>Description</th></tr>
        </thead>
        <tbody>
          {{#each settlementHistory}}
          <tr><td>{{this.date}}</td><td>{{this.fromName}}</td><td>{{this.toName}}</td><td>&euro;{{this.amount}}</td><td>{{this.description}}</td></tr>
          {{/each}}
        </tbody>
      </table>
      {{else}}
      <p class="empty">No settlements recorded yet.</p>
      {{/if}}
    </section>
  </div>
</div>
