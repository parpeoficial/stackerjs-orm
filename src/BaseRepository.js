import { DB } from "stackerjs-db";
import { Util } from "./Util";
import { BaseRepositoryEntities } from "./BaseRepositoryEntities";


export class BaseRepository extends BaseRepositoryEntities 
{
    constructor() 
    {
        super();

        this.withs = [];
    }

    with(withs) 
    {
        this.withs.push(withs);

        return this;
    }

    async validate(entity) 
    {
        if (!await this.beforeValidate(entity)) return false;

        this.entity.metadata().fields.forEach(field => 
        {
            let fieldName = field.alias ? field.alias : field.name;
            if (
                field.required &&
                (typeof entity[fieldName] === "undefined" ||
                    entity[fieldName] === null ||
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
                this.addError(field.name, `Field length is over ${field.max}`);

            if (
                field.min &&
                entity[fieldName] &&
                (entity[fieldName] < field.min ||
                    entity[fieldName].length < field.min)
            )
                this.addError(field.name, `Field length is under ${field.min}`);
        });

        if (!await this.afterValidate(entity)) return false;

        return !this.hasErrors();
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

    find(filter = null, limit = 100, offset = 0, orders = null) 
    {
        let queryBuilder = DB.Factory.getQueryBuilder()
            .select()
            .from(this.entity.metadata().table)
            .set("*")
            .limit(limit)
            .offset(offset);

        if (filter) queryBuilder.where(filter);

        if (orders) queryBuilder.order(...orders.map(o => 
        {
            let [order, direction] = o.split(" ");
            return [order, direction || "ASC"];
        }));

        return queryBuilder.execute().then(results => 
        {
            return Promise.all(results.map(result => 
            {
                return Util.makeEntity(this.entity, result, this.withs);
            }));
        });
    }

    findById(id) 
    {
        let filters = {};
        filters[this.getFieldByType("pk")] = id;

        return this.find(filters, 1, 0, null)
            .then(([result]) => result ? result : null);
    }

    findOne(filter) 
    {
        return this.find(filter, 1, 0, null)
            .then(([result]) => result ? result : null);
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
            entity[createdAt] = this.getCurrentTimeStamp();

        this.entity.metadata().fields.forEach(field => 
        {
            if (
                field.type !== "pk" &&
                field.type !== "updated_at" &&
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
        let parameters = 0;
        let expr = DB.Factory.getQueryCriteria();
        let queryBuilder = DB.Factory.getQueryBuilder()
            .update()
            .into(this.entity.metadata().table);

        let updatedAt = this.getFieldByType("updated_at");
        if (updatedAt)
            entity[updatedAt] = this.getCurrentTimeStamp();

        this.entity.metadata().fields.forEach(field => 
        {
            let fieldName = field.alias ? field.alias : field.name;
            if (field.type !== "pk" &&
                field.type !== "created_at" &&
                queryBuilder.treatValue(entity[fieldName]) !==
                queryBuilder.treatValue(entity._attributes[field.name])
            ) 
            {
                parameters++;
                queryBuilder.set(field.name, entity[fieldName]);
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

}
