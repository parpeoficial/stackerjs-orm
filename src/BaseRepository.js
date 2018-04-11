import { DB } from "stackerjs-db";
import { Util } from "./Util";

export class BaseRepository 
{
    constructor() 
    {
        this.errors = {};
        this.withs = [];
    }

    addError(field, message) 
    {
        if (!message) 
        {
            message = field;
            field = "Database";
        }

        if (!Array.isArray(this.errors[field])) this.errors[field] = [];

        if (message instanceof Error)
            return this.errors[field].push(message.message);

        this.errors[field].push(message);
    }

    getErrors() 
    {
        return this.errors;
    }

    hasErrors() 
    {
        return Object.keys(this.errors).length > 0;
    }

    beforeValidate() 
    {
        return Promise.resolve(true);
    }

    afterValidate() 
    {
        return Promise.resolve(true);
    }

    with(withs) 
    {
        this.withs.push(withs);

        return this;
    }

    async validate(entity) 
    {
        if (!await this.beforeValidate(entity)) 
        {
            if (!this.hasErrors())
                this.addError(
                    "validation",
                    "Presented problems before validating"
                );
            return false;
        }

        this.entity.metadata().fields.forEach(field => 
        {
            let fieldName = field.alias ? field.alias : field.name;
            if (
                field.required &&
                (typeof entity[fieldName] === "undefined" ||
                    (typeof entity[fieldName] === "string" &&
                        entity[fieldName].length < 1))
            )
                this.addError(field.name, "Field is required");

            if (
                field.max &&
                entity[fieldName] &&
                (entity[fieldName] > field.max ||
                    entity[fieldName].length > field.max)
            )
                this.addError(
                    field.name,
                    `Field length must be under ${field.max}`
                );

            if (
                field.min &&
                entity[fieldName] &&
                (entity[fieldName] < field.min ||
                    entity[fieldName].length < field.min)
            )
                this.addError(
                    field.name,
                    `Field length must be over ${field.min}`
                );
        });

        if (!await this.afterValidate(entity)) return false;

        return !this.hasErrors();
    }

    beforeSave() 
    {
        return Promise.resolve(true);
    }

    afterSave() 
    {
        return Promise.resolve(true);
    }

    async save(entity, validate = true) 
    {
        this.prepare(entity);

        if (validate && !await this.validate(entity)) return false;

        if (!await this.beforeSave(entity)) 
        {
            if (!this.hasErrors())
                this.addError("validation", "Presented problems before saving");
            return false;
        }

        if (this.isNewRecord(entity))
            return this.insert(entity).then(response => 
            {
                if (!response) return response;

                return this.afterSave(entity);
            });

        return this.update(entity).then(response => 
        {
            if (!response) return response;

            return this.afterSave(entity);
        });
    }

    findById(id) 
    {
        let expr = DB.Factory.getQueryCriteria();
        let queryBuilder = DB.Factory.getQueryBuilder()
            .select()
            .set("*")
            .from(this.entity.metadata().table)
            .where(expr.eq(this.getFieldByType("pk"), id))
            .limit(1);

        return queryBuilder.execute().then(async results => 
        {
            if (results.length <= 0) return null;

            return await Util.makeEntity(this.entity, results[0], this.withs);
        });
    }

    find(filter, limit = 100, offset = 0, order) 
    {
        let queryBuilder = DB.Factory.getQueryBuilder()
            .select()
            .from(this.entity.metadata().table)
            .set("*")
            .where(filter)
            .limit(limit)
            .offset(offset);

        if (order) queryBuilder.order(...order);

        return queryBuilder.execute().then(results => 
        {
            return Promise.all(results.map(result => 
            {
                return Util.makeEntity(this.entity, result, this.withs);
            }));
        });
    }

    findOne(filter) 
    {
        let queryBuilder = DB.Factory.getQueryBuilder()
            .select()
            .from(this.entity.metadata().table)
            .set("*")
            .where(filter)
            .limit(1);

        return queryBuilder.execute().then(([result]) => 
        {
            if (!result) return null;

            return Util.makeEntity(this.entity, result, this.withs);
        });
    }

    count(filters = null) 
    {
        let queryBuilder = DB.Factory.getQueryBuilder()
            .select()
            .set(["COUNT(*)", "total"])
            .from(this.entity.metadata().table);

        if (filters) queryBuilder.where(filters);

        return queryBuilder.execute().then(results => results[0].total);
    }

    delete(entity) 
    {
        let expr = DB.Factory.getQueryCriteria();
        let queryBuilder = DB.Factory.getQueryBuilder()
            .delete()
            .from(this.entity.metadata().table)
            .where(expr.eq(
                this.getFieldByType("pk"),
                entity[this.getFieldByType("pk")]
            ));

        return queryBuilder
            .execute()
            .then(() => true)
            .catch(err => 
            {
                this.addError(err.message);
                return false;
            });
    }

    insert(entity) 
    {
        let queryBuilder = DB.Factory.getQueryBuilder()
            .insert()
            .into(this.entity.metadata().table);

        let createdAt = this.getFieldByType("created_at");
        if (createdAt)
            entity[createdAt] = parseInt(new Date()
                .getTime()
                .toString()
                .slice(0, -3));

        this.entity.metadata().fields.forEach(field => 
        {
            if (
                field.type !== "pk" &&
                entity[field.alias ? field.alias : field.name] !== null &&
                typeof entity[field.alias ? field.alias : field.name] !==
                    "undefined"
            )
                queryBuilder.set(
                    field.name,
                    entity[field.alias ? field.alias : field.name]
                );
        });

        return queryBuilder
            .execute()
            .then(response => 
            {
                entity[this.getFieldByType("pk", true)] =
                    response.lastInsertedId;
                return true;
            })
            .catch(err => 
            {
                this.addError(err.message);
                return false;
            });
    }

    update(entity) 
    {
        let parameters = 1;
        let expr = DB.Factory.getQueryCriteria();
        let queryBuilder = DB.Factory.getQueryBuilder()
            .update()
            .into(this.entity.metadata().table);

        let updatedAt = this.getFieldByType("updated_at");
        if (updatedAt)
            entity[updatedAt] = parseInt(new Date()
                .getTime()
                .toString()
                .slice(0, -3));

        this.entity.metadata().fields.forEach(field => 
        {
            let fieldName = field.alias ? field.alias : field.name;
            if (field.type !== "pk") 
            {
                if (
                    field.type !== "created_at" &&
                    queryBuilder.treatValue(entity[fieldName]) !==
                        queryBuilder.treatValue(entity._attributes[field.name])
                ) 
                {
                    parameters++;
                    queryBuilder.set(field.name, entity[fieldName]);
                }
            }
        });
        if (parameters <= 1) return Promise.resolve(true);

        queryBuilder.where(expr.eq(
            this.getFieldByType("pk"),
            entity._attributes[this.getFieldByType("pk")]
        ));

        return queryBuilder
            .execute()
            .then(() => true)
            .catch(err => 
            {
                this.addError(err.message);
                return false;
            });
    }

    isNewRecord(entity) 
    {
        return (
            !entity._attributes ||
            typeof entity._attributes[this.getFieldByType("pk")] ===
                "undefined" ||
            !entity._attributes[this.getFieldByType("pk")]
        );
    }

    getFieldByType(type, alias = false) 
    {
        for (let field of this.entity.metadata().fields) 
        {
            if (field.type === type)
                return field.alias && alias ? field.alias : field.name;
        }

        return null;
    }

    prepare(entity) 
    {
        this.entity.metadata().fields.forEach(field => 
        {
            let fieldName = field.alias ? field.alias : field.name;
            if (
                typeof entity[fieldName] === "undefined" &&
                (field.default || field.default === 0)
            )
                entity[fieldName] = field.default;
        });
    }
}
