import { DB } from "stackerjs-db";

export class Util 
{
    static async makeEntity(defaultEntity, attributes, withs = []) 
    {
        if (Array.isArray(withs)) withs = this.prepareAssociations(withs);

        let entity = Object.create(defaultEntity),
            properties = {
                _attributes: {
                    value: attributes
                }
            },
            relations = {};

        this.makeEntityFields(properties, attributes, entity, defaultEntity.metadata());
        Object.defineProperties(entity, properties);

        await this.makeEntityRelations(
            relations,
            attributes,
            entity,
            defaultEntity.metadata(),
            withs
        );
        Object.defineProperties(entity, relations);

        return entity;
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

        return value;
    }

    static MANYMANYAssociation(entity, relation, withs = []) 
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
                        this.makeEntity(
                            relation.referencedEntity,
                            result,
                            withs
                        ))));
    }

    static HASONEAssociation(entity, relation, withs = []) 
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

                return this.makeEntity(
                    relation.referencedEntity,
                    results[0],
                    withs
                );
            });
    }

    static HASMANYAssociation(entity, relation, withs = []) 
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
                        this.makeEntity(
                            relation.referencedEntity,
                            result,
                            withs
                        ))));
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

    static async makeEntityRelations(
        properties,
        attributes,
        entity,
        metadata,
        withs
    ) 
    {
        await Promise.all(metadata.relations.map(async relation => 
        {
            let relationGetter = chainedWiths => 
            {
                if (relation.type === "HASMANY")
                    return this.HASMANYAssociation(
                        entity,
                        relation,
                        chainedWiths
                    )();
                else if (
                    relation.type === "HASONE" ||
                    relation.type === "BELONGSTO"
                )
                    return this.HASONEAssociation(
                        entity,
                        relation,
                        chainedWiths
                    )();
                else if (relation.type === "MANYMANY")
                    return this.MANYMANYAssociation(
                        entity,
                        relation,
                        chainedWiths
                    )();

                return null;
            };

            properties[relation.name] = {
                enumerable: typeof withs[relation.name] !== "undefined"
            };

            if (withs[relation.name])
                properties[relation.name].value = await relationGetter(withs[relation.name]);
            else properties[relation.name].get = relationGetter;
        }));
    }

    static prepareAssociations(withs) 
    {
        let associations = {};
        withs.forEach(w => 
        {
            w = w.split(".");
            if (w[1]) associations[w[0]] = this.prepareAssociations(w.slice(1));
            else associations[w[0]] = {};
        });

        return associations;
    }
}
