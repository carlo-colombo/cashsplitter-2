<div id="settlement-form-area">
  <div class="settlement-form">
    <h3>Record Settlement</h3>
    <form hx-post="{{{basePath}}}/api/groups/{{groupId}}/settlements" hx-target="#group-detail-area" hx-swap="outerHTML">
      <div class="form-group">
        <label for="from">Payer (who pays)</label>
        <select name="from" id="from">
          {{#each members}}
          <option value="{{this.id}}" {{#if this.isDefaultFrom}}selected{{/if}}>{{this.name}}</option>
          {{/each}}
        </select>
      </div>
      <div class="form-group">
        <label for="to">Receiver (who gets paid)</label>
        <select name="to" id="to">
          {{#each members}}
          <option value="{{this.id}}" {{#if this.isDefaultTo}}selected{{/if}}>{{this.name}}</option>
          {{/each}}
        </select>
      </div>
      <div class="form-group">
        <label for="amount">Amount (&euro;)</label>
        <input type="text" name="amount" id="amount" placeholder="0.00" />
      </div>
      <div class="form-group">
        <label for="description">Description (optional)</label>
        <input type="text" name="description" id="description" placeholder="settlement" />
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Record Settlement</button>
      </div>
    </form>
  </div>
</div>
