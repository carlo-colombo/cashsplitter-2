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
    </nav>
    <div id="member-form-area"></div>
    <div id="expense-form-area"></div>
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
        <li><strong>{{this.description}}</strong> &mdash; &euro;{{this.totalFormatted}} paid by {{this.payerName}}</li>
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
  </div>
</div>
