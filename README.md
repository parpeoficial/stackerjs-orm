[![Travis](https://img.shields.io/travis/parpeoficial/stackerjs-orm.svg)](https://travis-ci.org/parpeoficial/stackerjs-orm)
[![Test Coverage](https://api.codeclimate.com/v1/badges/a490f6b53e3d1cee3aaf/test_coverage)](https://codeclimate.com/github/parpeoficial/stackerjs-orm/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/a490f6b53e3d1cee3aaf/maintainability)](https://codeclimate.com/github/parpeoficial/stackerjs-orm/maintainability)
[![Dependencies](https://img.shields.io/david/parpeoficial/stackerjs-orm.svg)](https://david-dm.org/parpeoficial/stackerjs-orm)
[![npm](https://img.shields.io/npm/dt/stackerjs-orm.svg)](https://www.npmjs.com/package/stackerjs-orm)


[![NPM](https://nodei.co/npm/stackerjs-orm.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/stackerjs-orm/)

![StackerJS](https://s3-sa-east-1.amazonaws.com/parpe.prod/StackerJS-logo.png)

# Database: ORM
An ORM to be used inside and outside StackerJS

## Preparing
Entities must be configured:
```javascript
// Entities/User.js


export class User
{
    
    metadata()
    {
        return {
            'table': 'users',
            'fields': [
                { 'name': 'id', 'type': 'pk' },
                { 'name': 'name', 'type': 'string', 'required': true },
                { 'name': 'active', 'type': 'boolean', 'default': true }
            ],
            'relations': []
        }
    }

}
```

And then Repository is declared:
```javascript
// Repositories/UserRepository.js
import { User } from './../Entities/User';


export class UserRepository
{

    constructor()
    {
        this.entity = new User();
    }

}
```

## Inserting
```javascript
let user = new User();
user['name'] = 'My Name is...';

let usersRepository = new UserRepository();
usersRepository.save(user)
    .then(response => {
        if (!response)
            console.log(usersRepository.getErrors());

        return response;
    });
```

## Querying
```javascript
let usersRepository = new UserRepository();

// Fetching by ID
let user = await usersRepository.findById(1);

// Fetching one by filter as string
let user = await usersRepository.findOne("active = 1");

//Fetching many by filter as object
let user = await usersRepository.findAll({
    'active': { 'eq': true } // or 'active': [ 'eq', true ]
});
```

### Comparisions
| Term | MySQL Term | Description |
| ==== | ========== | =========== |
| eq | = | Looks for exactly equal results |
| neq | <> | Looks for exactly different |
| gt | > | Looks for greater values |
| gte | >= | Looks for greater or equal values |
| lt | < | Looks for lower values |
| lte | <= | Looks for lower or equal values |
| in | IN | Looks for values inside array |
| nin | NOT INT | Looks for values not inside array |