

export class BaseService
{

    constructor()
    {
        this.errors = {};
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

}