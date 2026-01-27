# bucket-sync

A quick and dirty react/electron app that can watch a folder and upload new files to a google cloud bucket.

I made this because I was photographing graduation ceremonies where we had to do this upload manually. This isn't a problem when all the photos are processed at the end of a ceremony. But at the University of Cambridge, the graduates exit one-by-one and their photo is processed automatically before they can make the 60 second trip to our sales desk. The only thing that wasn't done automatically was the upload, which had to be done by me 100 times a day, hence this software.

It's not perfect. If there is weird stuff going on with the network or with the files being uploaded, it will fail occasionally. It probably reduces the amount of attention given to the uploads by more than an order of magnitude, though.
