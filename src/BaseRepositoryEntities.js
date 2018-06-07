import { BaseRepositoryHooks } from "./BaseRepositoryHooks";


export class BaseRepositoryEntities extends BaseRepositoryHooks 
{

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

    getCurrentTimeStamp() 
    {
        return parseInt(new Date()
            .getTime()
            .toString()
            .slice(0, -3));
    }

}