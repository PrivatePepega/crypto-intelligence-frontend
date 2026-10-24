with open('components/indicators/indicator-card.tsx') as f:
    content = f.read()
content = content.replace('className="px-4 pb-3">', 'className="px-4 pb-3 pt-0">')
with open('components/indicators/indicator-card.tsx', 'w') as f:
    f.write(content)
print('done')
