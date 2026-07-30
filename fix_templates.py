import re

with open("template_block.txt") as f:
    template_code = f.read()

# Extract from '{template === "classic" ? (' to ')}' just before '</div>' at the end
start_marker = '{template === "classic" ? ('
start_idx = template_code.find(start_marker)
end_marker = '        )}'
end_idx = template_code.rfind(end_marker) + len(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Error: Could not find markers in template_block.txt")
    exit(1)

inner_template = template_code[start_idx:end_idx]

with open("components/billing/InvoiceDetailsDialog.tsx") as f:
    target_code = f.read()

target_start = target_code.find(start_marker)
# Find the closing ')}' that matches the end of the template block
# In InvoiceDetailsDialog.tsx, it looks like:
#               </div>
#             )}
#           </div>
#         </div>
target_end_marker = '            )}'
target_end = target_code.find(target_end_marker, target_start) + len(target_end_marker)

if target_start == -1 or target_end == -1:
    print("Error: Could not find markers in InvoiceDetailsDialog.tsx")
    exit(1)

new_code = target_code[:target_start] + inner_template + target_code[target_end:]

with open("components/billing/InvoiceDetailsDialog.tsx", "w") as f:
    f.write(new_code)

print("Replaced successfully")
