import { DB } from "stackerjs-db";

export class Util 
{
    static makeEntity(defaultEntity, attributes, withs = []) 
    {
        let metadata = defaultEntity.metadata();

        let entity = Object.create(defaultEntity),
            properties = {
                _attributes: {
                    value: attributes
                }
            };

        this.makeEntityFields(properties, attributes, entity, metadata);
        this.makeEntityRelations(
            properties,
            attributes,
            entity,
            metadata,
            withs
        );
        Object.defineProperties(entity, properties);

        return Promise.resolve(entity);
    }

    static fieldValueParser(type, value) 
    {
        if (type === "boolean") return value === 1;
        else if (type === "date") return new Date(value);
        else if (type === "json") 
        {
            try 
            {
                return JSON.parse(value);
            }
            catch (err) 
            {
                return value;
            }
        }
        else if (type === "created_at" || type === "updated_at")
            return value ? value * 1000 : null;
        else return value;
    }

    static MANYMANYAssociation(entity, relation) 
    {
        let expr = DB.Factory.getQueryCriteria();
        let queryBuilder = DB.Factory.getQueryBuilder()
            .select()
            .from(relation.table)
            .set(`${relation.referencedEntity.metadata().table}.*`)
            .join(
                "INNER",
                relation.referencedEntity.metadata().table,
                `${relation.table}.${relation.referencedField} = ` +
                    `${relation.referencedEntity.metadata().table}.id`
            )
            .where(expr.eq(relation.field, entity["_attributes"]["id"]));

        return () =>
            queryBuilder
                .execute()
                .then(results =>
                    Promise.all(results.map(result =>
                        this.makeEntity(relation.referencedEntity, result))));
    }

    static HASONEAssociation(entity, relation) 
    {
        let expr = DB.Factory.getQueryCriteria();
        let queryBuilder = DB.Factory.getQueryBuilder()
            .select()
            .from(relation.referencedEntity.metadata().table)
            .set("*")
            .where(expr.eq(
                relation.referencedField,
                entity["_attributes"][relation.field]
            ))
            .limit(1);

        return () =>
            queryBuilder.execute().then(results => 
            {
                if (results.length <= 0) return Promise.resolve(null);

                return this.makeEntity(relation.referencedEntity, results[0]);
            });
    }

    static HASMANYAssociation(entity, relation) 
    {
        let expr = DB.Factory.getQueryCriteria();
        let queryBuilder = DB.Factory.getQueryBuilder()
            .select()
            .from(relation.referencedEntity.metadata().table)
            .set("*")
            .where(expr.eq(
                relation.referencedField,
                entity["_attributes"][relation.field]
            ));

        return () =>
            queryBuilder
                .execute()
                .then(results =>
                    Promise.all(results.map(result =>
                        this.makeEntity(relation.referencedEntity, result))));
    }

    static makeEntityFields(properties, attributes, entity, metadata) 
    {
        metadata.fields.forEach(field => 
        {
            if (typeof attributes[field.name] !== "undefined") 
            {
                let name = field.alias ? field.alias : field.name;
                properties[name] = {
                    enumerable: true,
                    writable: true,
                    value: this.fieldValueParser(
                        field.type,
                        attributes[field.name]
                    )
                };
                properties._attributes.value[
                    field.name
                ] = this.fieldValueParser(field.type, attributes[field.name]);
            }
        });
    }

    static makeEntityRelations(
        properties,
        attributes,
        entity,
        metadata,
        withs
    ) 
    {
        metadata.relations.forEach(relation => 
        {
            properties[relation.name] = {
                enumerable: withs.includes(relation.name),
                get: () => 
                {
                    if (relation.type === "HASMANY")
                        return this.HASMANYAssociation(entity, relation)();
                    else if (
                        relation.type === "HASONE" ||
                        relation.type === "BELONGSTO"
                    )
                        return this.HASONEAssociation(entity, relation)();
                    else if (relation.type === "MANYMANY")
                        return this.MANYMANYAssociation(entity, relation)();

                    return null;
                }
            };
        });
    }
}
