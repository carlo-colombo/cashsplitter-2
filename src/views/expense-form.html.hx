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
    <fieldset class="form-field">
      <legend>Paid by</legend>
      <div id="paid-details">
        {{#each members}}
        <label>{{this.name}} &euro;<input type="number" name="paid_{{this.id}}" step="0.01" min="0" class="paid-input" data-member-idx="{{this@index}}"></label>
        {{/each}}
      </div>
      <p id="paid-validation" class="validation-message" style="display:none"></p>
    </fieldset>
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
var paidValidation = document.getElementById('paid-validation');

function updatePaidValidation() {
  var total = parseFloat(document.getElementById('total').value) || 0;
  var inputs = document.querySelectorAll('.paid-input');
  var sum = 0;
  for (var i = 0; i < inputs.length; i++) {
    sum += parseFloat(inputs[i].value) || 0;
  }
  if (Math.abs(sum - total) > 0.005) {
    paidValidation.style.display = 'block';
    paidValidation.textContent = 'Sum of paid amounts (\u20AC' + sum.toFixed(2) + ') must equal total (\u20AC' + total.toFixed(2) + ')';
    paidValidation.className = 'validation-message error';
  } else {
    paidValidation.style.display = 'none';
  }
}

document.getElementById('total').addEventListener('input', function() {
  var inputs = document.querySelectorAll('.paid-input');
  if (inputs.length > 0) {
    inputs[0].value = this.value;
  }
  updatePaidValidation();
});

var paidInputs = document.querySelectorAll('.paid-input');
for (var i = 0; i < paidInputs.length; i++) {
  paidInputs[i].addEventListener('input', updatePaidValidation);
}

document.querySelector('.expense-form form').addEventListener('submit', function(e) {
  var total = parseFloat(document.getElementById('total').value) || 0;
  var inputs = document.querySelectorAll('.paid-input');
  var sum = 0;
  for (var i = 0; i < inputs.length; i++) {
    sum += parseFloat(inputs[i].value) || 0;
  }
  if (Math.abs(sum - total) > 0.005) {
    e.preventDefault();
    alert('Sum of paid amounts (\u20AC' + sum.toFixed(2) + ') must equal total (\u20AC' + total.toFixed(2) + ')');
  }
});

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
