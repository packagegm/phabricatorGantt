Phabricator Gantt Diagrams
==========================

This is a quick prototype that displays all Phabricator Tasks (Maniphest) as a Gantt Diagram. For this purpose some things have to be configured.

* Original author: contact[at] ekenny[dot]org
* Current maintainer: Valerio Bozzolan

Configure Phabricator
---------------------

Gantt Diagrams need a start date and task duration, two fields Phabricator does not offer by default, however, it provides a very good and extensible framework; to add this JSON to this page:

http://EXAMPLE.org/config/edit/maniphest.custom-field-definitions/

```
{
  "estimated-days" : {
    "name"     : "Days Duration",
    "type"     : "int",
    "caption"  : "Estimated number of days this will take.",
    "required" : true
  },
  "start-day"      : {
    "name"     : "Start Date",
    "type"     : "date",
    "required" : true
  }
}
```

Then you will need to create a bot user to access tasks externally from this page:

http://EXAMPLE.org/people/create/

Dependencies
------------

The Arcanist library is needed to communicate with Phabricator:

```
# Download Arcanist from the parent directory
git clone https://secure.phabricator.com/diffusion/ARC/arcanist.git
```

Then copy the file `config-example.php` to `config.php` and fill it with your Phabricator's domain and conduit API token.

Happy Planning!
