$content = [System.IO.File]::ReadAllText('index.html', [System.Text.Encoding]::UTF8)

# Find the position of the filter-body opening and the Brand comment
$searchFor = 'id="filterBody" class="filter-body">'
$pos = $content.IndexOf($searchFor)

if ($pos -lt 0) {
    Write-Host "ERROR: Could not find filterBody"
    exit 1
}

# Find the Brand comment after filterBody
$brandComment = '<!-- Brand'
$brandPos = $content.IndexOf($brandComment, $pos)

if ($brandPos -lt 0) {
    Write-Host "ERROR: Could not find Brand comment"
    exit 1
}

Write-Host "Found filterBody at $pos, Brand comment at $brandPos"

# Insert the category filter before the Brand comment
$categoryFilter = @"
            <!-- Category -->
            <div class="filter-group">
              <label class="filter-label"><i class="fas fa-th-large"></i> <span data-translate="filter-category-label">Kateqoriya</span></label>
              <div class="category-buttons filter-btn-group" data-group="category">
                <button class="filter-pill category-button active" data-value=""><span data-translate="filter-cat-all">Ham&#x131;s&#x131;</span></button>
                <button class="filter-pill category-button" data-value="phone"><span data-translate="filter-cat-phone">Telefonlar</span></button>
                <button class="filter-pill category-button" data-value="tablet"><span data-translate="filter-cat-tablet">Plan&#x15F;etl&#x259;r</span></button>
                <button class="filter-pill category-button" data-value="headphone"><span data-translate="filter-cat-headphone">Qulaqc&#x131;qlar</span></button>
                <button class="filter-pill category-button" data-value="accessory"><span data-translate="filter-cat-accessory">Aksesuarlar</span></button>
              </div>
            </div>

            
"@

$newContent = $content.Substring(0, $brandPos) + $categoryFilter + $content.Substring($brandPos)
[System.IO.File]::WriteAllText('index.html', $newContent, [System.Text.Encoding]::UTF8)
Write-Host "SUCCESS: Category filter inserted"
