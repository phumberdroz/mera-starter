import test from 'ava';
import request from 'supertest';
import app from '../../../server';
import Post from '../post.model';
import { connectDB, dropDB } from '../../../util/test-helpers';

// Initial posts added into test db
const posts = [
  new Post({ name: 'Prashant', title: 'Hello Mera', slug: 'hello-Mera', cuid: 'f34gb2bh24b24b2', content: "All cats meow 'Mera!'" }),
  new Post({ name: 'Mayank', title: 'Hi Mera', slug: 'hi-Mera', cuid: 'f34gb2bh24b24b3', content: "All dogs bark 'Mera!'" }),
];

test.beforeEach('connect and add two post entries', t => {
  connectDB(t, () => {
    Post.create(posts, err => {
      if (err) t.fail('Unable to create posts');
    });
  });
});

test.afterEach.always(t => {
  dropDB(t);
});

test.serial('Should correctly give number of Posts', async t => {
  t.plan(2);

  const res = await request(app)
    .get('/V1/posts')
    .set('Accept', 'application/json');

  t.is(res.status, 200);
  t.deepEqual(posts.length, res.body.posts.length);
});

test.serial('Should send correct data when queried against a cuid', async t => {
  t.plan(2);

  const post = new Post({ name: 'Foo', title: 'bar', slug: 'bar', cuid: 'f34gb2bh24b24b2', content: 'Hello Mera says Foo' });
  post.save();

  const res = await request(app)
    .get('/V1/posts/f34gb2bh24b24b2')
    .set('Accept', 'application/json');

  t.is(res.status, 200);
  t.is(res.body.post.name, post.name);
});

test.serial('Should correctly add a post', async t => {
  t.plan(2);

  const res = await request(app)
    .post('/V1/posts')
    .send({ post: { name: 'Foo', title: 'bar', content: 'Hello Mera says Foo' } })
    .set('Accept', 'application/json');

  t.is(res.status, 200);

  const savedPost = await Post.findOne({ title: 'bar' }).exec();
  t.is(savedPost.name, 'Foo');
});

test.serial('Should correctly delete a post', async t => {
  t.plan(2);

  const post = new Post({ name: 'Foo', title: 'bar', slug: 'bar', cuid: 'f34gb2bh24b24b2', content: 'Hello Mera says Foo' });
  post.save();

  const res = await request(app)
    .delete(`/V1/posts/${post.cuid}`)
    .set('Accept', 'application/json');

  t.is(res.status, 200);

  const queriedPost = await Post.findOne({ cuid: post.cuid }).exec();
  t.is(queriedPost, null);
});

