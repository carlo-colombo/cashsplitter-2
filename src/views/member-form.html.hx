<div class="member-form">
  <h3>Add Member</h3>
  <form hx-post="{{{basePath}}}/api/groups/{{groupId}}/members" hx-target="#group-detail-area" hx-swap="outerHTML">
    <div class="form-field">
      <label for="member-name">Name</label>
      <input type="text" id="member-name" name="name" required>
    </div>
    <div class="form-actions">
      <button type="submit" class="btn btn-primary">Add</button>
      <button type="button" class="btn btn-secondary" hx-get="{{{basePath}}}/api/groups/{{groupId}}" hx-target="#group-detail-area" hx-swap="outerHTML">Cancel</button>
    </div>
  </form>
</div>
