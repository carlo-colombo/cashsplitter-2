<div class="expense-form">
  <h3>Add Expense</h3>
  <form hx-post="{{{basePath}}}/api/groups/{{groupId}}/expenses" hx-target="#group-detail-area" hx-swap="outerHTML">
    <div class="form-field">
      <label for="description">Description</label>
      <input type="text" id="description" name="description" required>
    </div>
    <div class="form-field">
      <label for="total">Total (&euro;)</label>
      <input type="number" id="total" name="total" step="0.01" min="0.01" required>
    </div>
    <div class="form-field">
      <label for="paidBy">Paid by</label>
      <select id="paidBy" name="paidBy" required>
        <option value="">Select payer</option>
        {{#each members}}
        <option value="{{this.id}}">{{this.name}}</option>
        {{/each}}
      </select>
    </div>
    <fieldset class="form-field">
      <legend>Split strategy</legend>
      <label><input type="radio" name="splitStrategy" value="equal" checked onchange="toggleSplitStrategy(this.value)"> Equal</label>
      <label><input type="radio" name="splitStrategy" value="shares" onchange="toggleSplitStrategy(this.value)"> By Shares</label>
      <label><input type="radio" name="splitStrategy" value="custom" onchange="toggleSplitStrategy(this.value)"> Custom</label>
    </fieldset>
    <div id="split-details">
      <p>All members split equally.</p>
    </div>
    <div class="form-actions">
      <button type="submit" class="btn btn-primary">Add Expense</button>
      <button type="button" class="btn btn-secondary" hx-get="{{{basePath}}}/api/groups/{{groupId}}" hx-target="#group-detail-area" hx-swap="outerHTML">Cancel</button>
    </div>
  </form>
  <script>
var members = {{{membersJson}}};
function toggleSplitStrategy(value) {
  var container = document.getElementById('split-details');
  var html = '';
  if (value === 'equal') {
    html = '<p>All members split equally.</p>';
  } else if (value === 'shares') {
    html = '<p>Enter share ratios:</p>';
    for (var i = 0; i < members.length; i++) {
      var m = members[i];
      html += '<label>' + escapeHtml(m.name) + ' <input type="number" name="shares_' + m.id + '" value="1" min="1" step="1"></label>';
    }
  } else if (value === 'custom') {
    html = '<p>Enter exact amounts:</p>';
    for (var i = 0; i < members.length; i++) {
      var m = members[i];
      html += '<label>' + escapeHtml(m.name) + ' &euro;<input type="number" name="amount_' + m.id + '" step="0.01" min="0"></label>';
    }
  }
  container.innerHTML = html;
}
function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
  </script>
</div>
