<div class="groups-page">
  <div class="create-group-form">
    <h2>Create Group</h2>
    <form hx-post="{{{basePath}}}/api/groups" hx-target="#main-content" hx-swap="innerHTML">
      <input type="text" name="name" placeholder="Group name" required minlength="1">
      <button type="submit" class="btn btn-primary">Create</button>
    </form>
  </div>
  {{#if hasGroups}}
  <div class="groups-list">
    {{#each groups}}
    <div class="group-card">
      <div class="group-card-header">
        <h3><a href="#/groups/{{this.id}}" hx-get="{{{basePath}}}/api/groups/{{this.id}}" hx-target="#main-content" hx-push-url="{{{basePath}}}/#/groups/{{this.id}}">{{this.name}}</a></h3>
        <button class="btn btn-danger btn-sm" hx-post="{{{basePath}}}/api/groups/{{this.id}}/delete" hx-target="#main-content" hx-swap="innerHTML" hx-confirm="Delete this group and all its data? This cannot be undone.">&times;</button>
      </div>
      <div class="group-card-body">
        {{#if this.hasMembers}}
        <div class="group-members">Members: {{this.memberNames}}</div>
        {{else}}
        <div class="group-members empty">No members</div>
        {{/if}}
        {{#if this.hasExpenses}}
        <div class="group-expenses">{{this.expenseCount}} expenses &middot; &euro;{{this.expenseTotalFormatted}} total</div>
        {{else}}
        <div class="group-expenses empty">No expenses</div>
        {{/if}}
      </div>
    </div>
    {{/each}}
  </div>
  {{else}}
  <div class="empty-state">
    <p>No groups yet. Create your first group!</p>
  </div>
  {{/if}}
</div>
