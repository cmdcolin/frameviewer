# frameviewer

A JBrowse plugin for viewing which reading frame a coding region is in

## Screenshot

![](img/1.png)


## Configuration

style.frameHeight - the height of the feature that contains the frames. Default 50px


## Example

    {
     "label" : "dictyBase frames",
     "urlTemplate" : "tracks/dictyBase/{refseq}/trackData.json",
     "storeClass" : "JBrowse/Store/SeqFeature/NCList",
     "type" : "FrameViewer/View/Track/Frames"
    }

The test/data/ directory contains a sample config also.

## Installation

Download to plugins/FrameViewer and add

    "plugins": ["FrameViewer"]

to jbrowse_conf.json or trackList.json. See JBrowse FAQ on installing plugins for more details


## Feedback

Please let me know if you have feedback or know of crazy biology corner cases that need covering!
