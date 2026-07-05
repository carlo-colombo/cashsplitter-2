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
      <h3><a href="#/groups/{{this.id}}" hx-get="{{{basePath}}}/api/groups/{{this.id}}" hx-target="#main-content" hx-push-url="/#/groups/{{this.id}}">{{this.name}}</a></h3>
    </div>
    {{/each}}
  </div>
  {{else}}
  <div class="empty-state">
    <p>No groups yet. Create your first group!</p>
  </div>
  {{/if}}
</div>
