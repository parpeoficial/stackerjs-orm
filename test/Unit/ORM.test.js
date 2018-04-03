import { expect } from "chai";
import { Config } from "stackerjs-utils";
import { DB } from "stackerjs-db";
import { Contact, Schedule, Phone } from "./../DataProvider/Entities";
import {
    ContactRepository,
    SchedulesRepository
} from "./../DataProvider/Repositories";

describe("ORMTest", function() 
{
    this.timeout(6000);
    before(function(done) 
    {
        let qb = DB.Factory.getQueryBuilder();
        Promise.all([
            qb
                .table()
                .create("contacts")
                .set({
                    id: { type: "pk", required: true },
                    first_name: { type: "varchar", size: 100, required: true },
                    last_name: { type: "varchar", size: 100, required: true },
                    status: { type: "tinyint", size: 1, defaultValue: 1 },
                    life_years: { type: "tinyint", size: 1, defaultValue: 18 },
                    a_json_field: { type: "text", required: true },
                    created_at: { type: "integer" },
                    updated_at: { type: "integer" }
                })
                .execute(),

            qb
                .table()
                .create("contacts_schedules")
                .set({
                    id: { type: "pk", required: true },
                    contact_id: { type: "int", required: true },
                    schedule_id: { type: "int", required: true }
                })
                .execute()
                .then(() =>
                    Promise.all([
                        qb
                            .insert()
                            .into("contacts_schedules")
                            .set({ contact_id: 1, schedule_id: 1 })
                            .execute(),
                        qb
                            .insert()
                            .into("contacts_schedules")
                            .set({ contact_id: 1, schedule_id: 2 })
                            .execute(),
                        qb
                            .insert()
                            .into("contacts_schedules")
                            .set({ contact_id: 1, schedule_id: 3 })
                            .execute()
                    ])),

            qb
                .table()
                .create("schedules")
                .set({
                    id: { type: "pk", required: true },
                    start_time: { type: "datetime", required: true },
                    end_time: { type: "datetime", required: true },
                    extra: { type: "text" },
                    active: { type: "boolean", defaultValue: true }
                })
                .execute()
                .then(() =>
                    Promise.all([
                        qb
                            .insert()
                            .into("schedules")
                            .set({
                                start_time: "2017-10-02 17:00:00",
                                end_time: "2017-10-02 17:30:00",
                                extra: "_"
                            })
                            .execute(),
                        qb
                            .insert()
                            .into("schedules")
                            .set({
                                start_time: "2017-10-03 17:00:00",
                                end_time: "2017-10-03 17:30:00",
                                extra: "_"
                            })
                            .execute(),
                        qb
                            .insert()
                            .into("schedules")
                            .set({
                                start_time: "2017-10-04 17:00:00",
                                end_time: "2017-10-04 17:30:00",
                                extra: "_"
                            })
                            .execute()
                    ])),

            qb
                .table()
                .create("contact_addresses")
                .set({
                    id: { type: "pk", required: true },
                    contact_id: { type: "int", required: true },
                    extra: { type: "text" }
                })
                .execute(),

            qb
                .table()
                .create("contact_phones")
                .set({
                    id: { type: "pk", required: true },
                    contact_id: { type: "int", required: true },
                    phone_number: { type: "varchar", size: 20, required: true },
                    active: { type: "boolean", defaultValue: true }
                })
                .execute()
                .then(() =>
                    Promise.all([
                        qb
                            .insert()
                            .into("contact_phones")
                            .set({ id: 1, contact_id: 1, phone_number: "123" })
                            .execute(),
                        qb
                            .insert()
                            .into("contact_phones")
                            .set({ id: 2, contact_id: 1, phone_number: "456" })
                            .execute(),
                        qb
                            .insert()
                            .into("contact_phones")
                            .set({ id: 3, contact_id: 1, phone_number: "789" })
                            .execute()
                    ]))
        ]).then(() => done());
    });

    describe("EntityTest", () => 
    {
        it("Should define an Entity without trouble", () => 
        {
            let contact = new Contact();
            contact.setLastName("Guedes");
            expect(contact.getLastName()).to.be.equal("Guedes");
            contact.setFirstName("Vinicius");
            expect(contact.getFirstName()).to.be.equal("Vinicius");
            contact.extra = {
                hello: "world"
            };
        });
    });

    describe("RepositoryTest", () => 
    {
        describe("Inserting Entitities", () => 
        {
            it("Should save Entity without trouble", done => 
            {
                let contact = new Contact();
                contact.setFirstName("Vinicius");
                contact.setLastName("Guedes");

                let contactRepository = new ContactRepository();
                contactRepository
                    .save(contact)
                    .then(response => 
                    {
                        expect(response).to.be.true;
                        expect(contact).to.have.property("primary");
                        expect(contact.getId()).to.be.equal(1);
                    })
                    .then(() => done());
            });

            it("Should validate REQUIRED fields", done => 
            {
                let contact = new Contact();
                contact.setFirstName("Vinicius");

                let contactRepository = new ContactRepository();
                contactRepository
                    .save(contact)
                    .then(response => 
                    {
                        expect(response).to.be.false;

                        let errors = contactRepository.getErrors();
                        expect(errors).to.have.property("last_name");
                    })
                    .then(() => done());
            });

            it("Should validate REQUIRED integer fields", done => 
            {
                let contactRepository = new ContactRepository();
                contactRepository
                    .save({
                        first_name: "Some",
                        last_name: "one",
                        active: 0
                    })
                    .then(response => expect(response).to.be.true)
                    .then(() => done());
            });

            it("Should validate fields MAX LENGTH", done => 
            {
                let contact = new Contact();
                contact.setFirstName("01234567890123456789012345678901234567890123456789" +
                        "012345678901234567890123456789012345678901234567891");
                contact.setLastName("Guedes");
                contact.setAge(100);

                let contactRepository = new ContactRepository();
                contactRepository
                    .save(contact)
                    .then(response => 
                    {
                        expect(response).to.be.false;

                        let errors = contactRepository.getErrors();
                        expect(errors).to.have.property("first_name");
                    })
                    .then(() => done());
            });

            it("Should validate fields MIN LENGTH", done => 
            {
                let contact = new Contact();
                contact.setFirstName("Vinicius");
                contact.setLastName("G");
                contact.setAge(17);

                let contactRepository = new ContactRepository();
                contactRepository
                    .save(contact)
                    .then(response => 
                    {
                        expect(response).to.be.false;

                        let errors = contactRepository.getErrors();
                        expect(errors).to.have.property("last_name");
                    })
                    .then(() => done());
            });

            it("Should present error after validating", done => 
            {
                let contact = new Contact();
                contact.setFirstName("Vinicius");
                contact.setLastName("Guedes");
                contact["test_after_validate_error"] = true;

                let contactRepository = new ContactRepository();
                contactRepository
                    .save(contact)
                    .then(response => 
                    {
                        expect(response).to.be.false;
                    })
                    .then(() => done());
            });
        });

        describe("Finding entity list", () => 
        {
            it("Creating entities before start filtering", async () => 
            {
                let contactRepository = new ContactRepository();

                await contactRepository.save({
                    first_name: "Joabe",
                    last_name: "Santos"
                });

                await contactRepository.save({
                    first_name: "Lucio",
                    last_name: "Pamplona"
                });

                await contactRepository.save({
                    first_name: "Felipe",
                    last_name: "Faria",
                    extra: {
                        you: "crazy",
                        mother: "fucker"
                    }
                });
            });

            it("Should filter through entities by string", done => 
            {
                new ContactRepository()
                    .find("first_name LIKE '%Fel%' OR last_name LIKE '%Pam%'")
                    .then(entities => 
                    {
                        expect(entities).to.be.instanceOf(Array);
                        expect(entities.length).to.be.equal(2);
                    })
                    .then(() => done());
            });

            it("Should filter through entities by object", done => 
            {
                new ContactRepository()
                    .find({
                        first_name: "Joabe",
                        last_name: {
                            like: "San"
                        }
                    })
                    .then(entities => 
                    {
                        console.log(entities[0].first_name);
                        expect(entities).to.be.instanceOf(Array);
                        expect(entities.length).to.be.equal(1);
                    })
                    .then(() => done());
            });

            it("Should order results", done => 
            {
                new ContactRepository()
                    .find({}, 10, 0, ["first_name", "last_name"])
                    .then(entities => 
                    {
                        expect(entities).to.be.instanceOf(Array);
                    })
                    .then(() => done());
            });
        });

        describe("Finding and Updating Entity by ID", () => 
        {
            it("Should find an Entity by ID and update it without trouble", async () => 
            {
                let contactRepository = new ContactRepository();
                let contact = await contactRepository.findById(1);
                expect(contact).to.be.instanceOf(Contact);
                expect(contact.getLastName()).to.be.equal("Guedes");
                contact.setFirstName("Rafael");
                contact.setLastName("Ali");

                let response = await contactRepository.save(contact);
                expect(response).to.be.true;
            });

            it("Should return true even if no field is updated", async () => 
            {
                let contactRepository = new ContactRepository();
                let contact = await contactRepository.findById(1);

                let response = await contactRepository.save(contact);
                expect(response).to.be.true;
            });

            it("Should present error when searching for non existent entity", async () => 
            {
                expect(await new ContactRepository().findById(-10)).to.be.null;
            });
        });

        describe("Finding one entity by filters", () => 
        {
            it("Should find an Entity without trouble", done => 
            {
                new ContactRepository()
                    .findOne()
                    .then(contact => 
                    {
                        expect(contact).to.be.instanceof(Contact);
                    })
                    .then(() => done());
            });

            it("Should return null when nothing is find", done => 
            {
                new ContactRepository()
                    .findOne("first_name=2")
                    .then(contact => 
                    {
                        expect(contact).to.be.null;
                    })
                    .then(() => done());
            });
        });

        describe("Finding Entities and it's associated datas", () => 
        {
            it("Should find an Entity and associated HASMANY entities", async () => 
            {
                let contact = await new ContactRepository().findById(1);

                let phones = await contact.getPhones();
                expect(phones.length).to.be.equal(3);
                expect(phones[0].getPhoneNumber()).to.be.equal("123");
                expect(phones[0].isActive()).to.be.true;
            });

            it("Should find an Entity and associated BELONGSTO entities", async () => 
            {
                let contact = await new ContactRepository().findById(1);

                let phones = await contact.getPhones();
                expect(phones).to.be.instanceOf(Array);
                expect(phones.length).to.be.equal(3);
                expect(phones[0]).to.be.instanceOf(Phone);
                expect(phones[0].getPhoneNumber()).to.be.equal("123");
                expect(phones[0].isActive()).to.be.true;

                let contactAgain = await phones[0].getContact();
                expect(contactAgain.getId()).to.be.equal(1);
            });

            it("Should find and Entity and associated MANYMANY entities", async () => 
            {
                let contact = await new ContactRepository().findById(1);

                let schedules = await contact.getSchedules();
                expect(schedules).to.be.instanceOf(Array);
                expect(schedules.length).to.be.equal(3);
                expect(schedules[0]).to.be.instanceOf(Schedule);
                expect(schedules[0].getStartTime()).to.be.instanceOf(Date);
                expect(schedules[0].getStartTime().getFullYear()).to.be.equal(2017);
            });

            it("Should return null when BELONGSTO returns nothing", async () => 
            {
                let contact = await new ContactRepository().findById(1);
                expect(await contact.getAddress()).to.be.null;
            });

            it("Should return null when association is defiend wrongly", async () => 
            {
                let contact = await new ContactRepository().findById(1);

                expect(await contact.something).to.be.null;
            });
        });

        describe("Counting registers", () => 
        {
            it("Should count amount of contacts without trouble", done => 
            {
                let contactRepository = new ContactRepository();

                contactRepository
                    .count()
                    .then(result => expect(result).to.be.equal(5))
                    .then(() => done());
            });

            it("Should count amount contacts filtered", done => 
            {
                let contactRepository = new ContactRepository();

                contactRepository
                    .count({
                        first_name: ["like", "Joabe"]
                    })
                    .then(result => expect(result).to.be.equal(1))
                    .then(() => done());
            });
        });

        describe("Finding and Deleting Entity", () => 
        {
            it("Should find an Entity by ID and delete it without trouble", async () => 
            {
                let contactRepository = new ContactRepository();

                let contact = await contactRepository.findById(1);
                expect(contact).to.be.instanceOf(Contact);
                expect(contact.getLastName()).to.be.equal("Ali");

                let response = await contactRepository.delete(contact);
                expect(response).to.be.true;
            });
        });

        describe("Repositories events", () => 
        {
            it("Should set default error message when not defined in before validate", done => 
            {
                let contactRepository = new ContactRepository();

                contactRepository
                    .save({
                        first_name: "Vinicius",
                        last_name: "Guedes",
                        test_before_validate: true
                    })
                    .then(response => expect(response).to.be.false)
                    .then(() => done());
            });

            it("Should set default error message when not defined in before validate", done => 
            {
                let contactRepository = new ContactRepository();

                contactRepository
                    .save({
                        first_name: "Vinicius",
                        last_name: "Guedes",
                        test_before_validate: true,
                        test_before_validate_insert_error: true
                    })
                    .then(response => expect(response).to.be.false)
                    .then(() => done());
            });

            it("Should set default error message when not defined in before validate", done => 
            {
                let contactRepository = new ContactRepository();

                contactRepository
                    .save({
                        first_name: "Vinicius",
                        last_name: "Guedes",
                        test_before_save: true
                    })
                    .then(response => expect(response).to.be.false)
                    .then(() => done());
            });

            it("Should set default error message when not defined in before validate", done => 
            {
                let contactRepository = new ContactRepository();

                contactRepository
                    .save({
                        first_name: "Vinicius",
                        last_name: "Guedes",
                        test_before_save: true,
                        test_before_save_insert_error: true
                    })
                    .then(response => expect(response).to.be.false)
                    .then(() => done());
            });
        });
    });

    describe("Saving data without time updates", () => 
    {
        it("Should insert a Schedule without created_at", done => 
        {
            let schedule = {
                start_time: new Date(),
                end_time: new Date(),
                extra: { some: "thing" }
            };

            new SchedulesRepository()
                .save(schedule)
                .then(response => 
                {
                    expect(response).to.be.true;
                    Config.set("schedule.id", schedule["id"]);
                })
                .then(() => done());
        });

        it("Should update a Schedule without updated_at", async () => 
        {
            let schedulesRepository = new SchedulesRepository();

            let schedule = await schedulesRepository.findById(Config.get("schedule.id"));

            await schedulesRepository
                .save(schedule)
                .then(response => expect(response).to.be.true);
        });
    });

    after(function(done) 
    {
        let qb = DB.Factory.getQueryBuilder();
        Promise.all([
            qb
                .table()
                .drop("contacts")
                .execute(),
            qb
                .table()
                .drop("contacts_schedules")
                .execute(),
            qb
                .table()
                .drop("schedules")
                .execute(),
            qb
                .table()
                .drop("contact_addresses")
                .execute(),
            qb
                .table()
                .drop("contact_phones")
                .execute()
        ])
            .then(() => DB.Factory.getConnection().disconnect())
            .then(() => done());
    });
});
