Phabricator Gantt Diagrams
==========================

This is a quick prototype that displays all Phabricator Tasks (Maniphest) as a Gantt Diagram. For this purpose some things have to be configured.

* Original author: contact[at] ekenny[dot]org
* Current maintainer: Valerio Bozzolan

Configure Phabricator
---------------------

Gantt Diagrams need some additional fields Phabricator does not offer by default, however,
Phabricator provides a very good and extensible framework and we can add some fields.

* Expected Start: to eventually plan the start of work (for your coworkers or for your Project Manager)
* Deadline: planned date for the end of the works (useful for you or for your Project Manager)

Go to this page and paste this JSON:

http://EXAMPLE.org/config/edit/maniphest.custom-field-definitions/

```
{
  "startdate": {
    "name": "Expected Start",
    "caption": "The Expected Start is WHEN someone should START working on this (default: Task creation date).",
    "type": "date",
    "required": false
  },
  "deadline": {
    "name": "Deadline",
    "caption": "The Deadline is WHEN someone should END working on this.",
    "type": "date",
    "required": false
  }
}
```

Then you will need to create a bot user to access tasks externally from this page. Create a "Gantt Bot" user.

http://EXAMPLE.org/people/create/

Dependencies
------------

The Arcanist library is needed to communicate with Phabricator:

```
# Download Arcanist from the parent directory
git clone https://secure.phabricator.com/diffusion/ARC/arcanist.git
```

Then copy the file `config-example.php` to `config.php`. Fill the configuration with your Phabricator's domain, the conduit API token of your "Gantt Bot" user, etc.

Happy Planning!

Disclaimer
----------

Copyright (C) 2014 [kennyeni](https://github.com/kennyeni) and 2020 [Valerio Bozzolan](https://boz.reyboz.it/)

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
