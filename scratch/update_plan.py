import re

with open('docs/superpowers/plans/2026-06-25-plan-2-backend.md', 'r') as f:
    content = f.read()

# Replace Knex.js with Sequelize
content = content.replace('Knex.js', 'Sequelize')
content = content.replace('knexfile.ts', 'sequelize.ts')
content = content.replace('knex migrate:latest', 'sequelize db:migrate')
content = content.replace('knex migrate:rollback', 'sequelize db:migrate:undo')
content = content.replace('knex seed:run', 'sequelize db:seed:all')
content = content.replace('"knex": "^3.1.0"', '"sequelize": "^6.37.3",\n    "pg-hstore": "^2.3.4"')

# We will need more sophisticated replacements to change the Knex migrations to Sequelize models
# and the repositories to use Sequelize models. 
# Since this requires a massive rewrite of the Tasks, I will just generate the new Tasks text in Python
# and replace the relevant sections.

task2_content = """### Task 2: Database Setup with Sequelize Models

**Files:**

- Create: `apps/backend/src/db/sequelize.ts`
- Create: `apps/backend/src/models/User.ts`
- Create: `apps/backend/src/models/Staff.ts`
- Create: `apps/backend/src/models/Skill.ts`
- Create: `apps/backend/src/models/Project.ts`
- Create: `apps/backend/src/models/Participation.ts`
- Create: `apps/backend/src/models/Template.ts`
- Create: `apps/backend/src/models/GeneratedCV.ts`
- Create: `apps/backend/src/models/index.ts`
- Create: `apps/backend/src/db/seeds/runSeeds.ts`

**Interfaces:**

- Produces: `sequelize` instance and initialized models exported from `src/models/index.ts`. Used by all repositories.

- [ ] **Step 1: Create `apps/backend/src/db/sequelize.ts`**

```ts
import { Sequelize } from 'sequelize';
import { config } from '../config.js';

export const sequelize = new Sequelize(config.databaseUrl, {
  dialect: 'postgres',
  logging: config.nodeEnv === 'development' ? console.log : false,
});
```

- [ ] **Step 2: Create Models in `apps/backend/src/models/`**

Create `User.ts`, `Staff.ts`, `Skill.ts`, `Project.ts`, `Participation.ts`, `Template.ts`, `GeneratedCV.ts` using Sequelize `define` or class extensions.
*(Note: Implementers should use Sequelize Data Types to define schemas matching the existing columns: id, email, password_hash, role, etc. For brevity in this plan, define standard Sequelize models).*

- [ ] **Step 3: Create `apps/backend/src/models/index.ts`**

```ts
import { sequelize } from '../db/sequelize.js';
// Import models here and setup associations
// User.hasOne(Staff); Staff.belongsTo(User);
// Staff.hasMany(Skill); Skill.belongsTo(Staff);
// Project.belongsToMany(Staff, { through: Participation });
// Staff.belongsToMany(Project, { through: Participation });
// Template.hasMany(GeneratedCV); GeneratedCV.belongsTo(Template);
// Staff.hasMany(GeneratedCV); GeneratedCV.belongsTo(Staff);

export { sequelize };
// Export models
```

- [ ] **Step 4: Create Seed script `apps/backend/src/db/seeds/runSeeds.ts`**

Use Sequelize `.bulkCreate` to insert the default templates.

- [ ] **Step 5: Add sync script and run**

Add to `package.json`: `"db:sync": "tsx src/db/sync.ts"`
Create `sync.ts` that calls `await sequelize.sync({ alter: true })`.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/db apps/backend/src/models
git commit -m "feat(backend): add Sequelize models and sync"
```
"""

content = re.sub(r'### Task 2: Database Setup with Knex Migrations.*?### Task 3: Auth Routes', task2_content + '\n---\n\n### Task 3: Auth Routes', content, flags=re.DOTALL)

with open('docs/superpowers/plans/2026-06-25-plan-2-backend.md', 'w') as f:
    f.write(content)

