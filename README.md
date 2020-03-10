Phabricator Gantt Diagrams
==========================

This is a quick prototype that displays all Phabricator Tasks (Maniphest) as a Gantt Diagram. For this purpose some things have to be configured.

* Original author: contact[at] ekenny[dot]org
* Current maintainer: Valerio Bozzolan

Configure Phabricator
---------------------

Gantt Diagrams need some additional fields Phabricator does not offer by default, however,
Phabricator provides a very good and extensible framework; to add this JSON to this page:

http://EXAMPLE.org/config/edit/maniphest.custom-field-definitions/

```
{
  "deadline": {
    "name": "Deadline",
    "type": "date",
    "required": false
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
